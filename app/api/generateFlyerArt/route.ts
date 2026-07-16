import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { convexQuery } from "@/app/utils/convexServer";

// Image generation regularly takes 60-90s
export const maxDuration = 180;

/**
 * Generates black-and-white background art for an event flyer with
 * OpenAI's image API, stores it in Convex file storage, and saves the
 * URL on the event. Committee-only; art is generated once per click,
 * not on every flyer render.
 */
export async function POST(request: NextRequest) {
	const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
	const openaiKey = process.env.OPENAI_API_KEY;
	const secret = process.env.COMMITTEE_API_SECRET;

	if (!convexUrl || !openaiKey || !secret) {
		const missing = [
			!convexUrl && "NEXT_PUBLIC_CONVEX_URL",
			!openaiKey && "OPENAI_API_KEY",
			!secret && "COMMITTEE_API_SECRET"
		]
			.filter(Boolean)
			.join(", ");
		console.error(`generateFlyerArt misconfigured — missing: ${missing}`);
		return NextResponse.json(
			{ success: false, error: "Flyer art generation is not configured." },
			{ status: 500 }
		);
	}

	try {
		const user = await currentUser();
		const senderEmail = user?.primaryEmailAddress?.emailAddress;
		if (!senderEmail) {
			return NextResponse.json(
				{ success: false, error: "Not signed in." },
				{ status: 401 }
			);
		}

		const convex = new ConvexHttpClient(convexUrl);
		const convexUser = await convexQuery<Doc<"users"> | null>(
			"users:getUser",
			{ email: senderEmail }
		);
		if (convexUser?.role !== "committee") {
			return NextResponse.json(
				{ success: false, error: "Committee members only." },
				{ status: 403 }
			);
		}

		const { eventId } = await request.json();
		if (!eventId || typeof eventId !== "string") {
			return NextResponse.json(
				{ success: false, error: "eventId is required." },
				{ status: 400 }
			);
		}

		const event = await convexQuery<Doc<"events"> | null>("events:getById", {
			id: eventId
		});
		if (!event) {
			return NextResponse.json(
				{ success: false, error: "Event not found." },
				{ status: 404 }
			);
		}

		// Light monochrome photography reads well behind the solid white
		// poster boxes and survives black-and-white printing.
		const prompt = [
			`A soft, high-key black-and-white photograph to sit behind bold`,
			`poster typography on a community event flyer.`,
			`Event: ${event.title}. ${event.description}`,
			`Light tones, gentle contrast, appetizing and warm subject matter,`,
			`slightly out of focus. Absolutely no text, letters, words, numbers,`,
			`logos, or people's faces.`
		].join(" ");

		const genRes = await fetch("https://api.openai.com/v1/images/generations", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${openaiKey}`
			},
			body: JSON.stringify({
				model: "gpt-image-2",
				prompt,
				// Near-exact flyer aspect ratio (1275x1650); gpt-image-2 takes
				// any size in multiples of 16, so cover-crop loss is minimal
				size: "1216x1568",
				quality: "medium",
				n: 1
			})
		});

		if (!genRes.ok) {
			const errBody = await genRes.text();
			console.error(`OpenAI image generation failed: ${genRes.status} ${errBody}`);
			return NextResponse.json(
				{ success: false, error: "Image generation failed." },
				{ status: 502 }
			);
		}

		const genData = await genRes.json();
		const b64 = genData?.data?.[0]?.b64_json;
		if (!b64) {
			throw new Error("OpenAI response contained no image data");
		}
		const imageBytes = Buffer.from(b64, "base64");

		// Upload into Convex file storage, then save the URL on the event
		const uploadUrl = await convex.mutation(api.events.generateUploadUrl, {
			requesterEmail: senderEmail,
			secret
		});
		const uploadRes = await fetch(uploadUrl, {
			method: "POST",
			headers: { "Content-Type": "image/png" },
			body: imageBytes
		});
		if (!uploadRes.ok) {
			throw new Error(`Convex storage upload failed with ${uploadRes.status}`);
		}
		const { storageId } = await uploadRes.json();

		await convex.mutation(api.events.setEventImage, {
			id: eventId as Id<"events">,
			storageId,
			updaterEmail: senderEmail,
			secret
		});

		return NextResponse.json({ success: true }, { status: 200 });
	} catch (error) {
		console.error("Error generating flyer art:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to generate flyer art." },
			{ status: 500 }
		);
	}
}
