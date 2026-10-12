import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { convexQuery } from "@/app/utils/convexServer";
import { generateFlyerPoster } from "@/app/utils/flyerPoster";
import {
	emailFlyerToPrinter,
	missingFlyerEmailEnv
} from "@/app/utils/flyerEmail";

// One poster is ~35-60s, plus a proofread; two attempts plus the email
// can approach three minutes.
export const maxDuration = 300;

function secretMatches(given: string, expected: string): boolean {
	const a = Buffer.from(given);
	const b = Buffer.from(expected);
	return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Designs the event's flyer poster with gpt-image-2.5-sunburst (see
 * app/utils/flyerPoster.ts), stores it in Convex file storage, and saves the
 * URL on the event. The QR/how-to footer is added by the flyer renderer.
 *
 * Callers:
 *  - Committee members on the website (Clerk session + committee role).
 *  - Trusted agents (Echo) with header `x-committee-secret` and a
 *    `requesterEmail` that is a committee user. This route is public in
 *    middleware for that reason, so these two checks ARE the auth.
 *
 * `emailPrinter: true` (used right after an event is created) emails the
 * flyer to the printer afterwards - even if the poster failed, in which case
 * the code-drawn flyer goes out, so a new event always reaches the printer.
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
		console.error(`generateFlyerArt misconfigured - missing: ${missing}`);
		return NextResponse.json(
			{ success: false, error: "Flyer design is not configured." },
			{ status: 500 }
		);
	}

	let body: { eventId?: unknown; emailPrinter?: unknown; requesterEmail?: unknown };
	try {
		body = await request.json();
	} catch {
		return NextResponse.json(
			{ success: false, error: "Invalid JSON body." },
			{ status: 400 }
		);
	}

	const agentSecret = request.headers.get("x-committee-secret");
	let requesterEmail: string | undefined;
	if (agentSecret !== null) {
		if (!secretMatches(agentSecret, secret)) {
			return NextResponse.json(
				{ success: false, error: "Invalid committee secret." },
				{ status: 403 }
			);
		}
		requesterEmail =
			typeof body.requesterEmail === "string" ? body.requesterEmail : undefined;
	} else {
		const user = await currentUser();
		requesterEmail = user?.primaryEmailAddress?.emailAddress;
	}
	if (!requesterEmail) {
		return NextResponse.json(
			{ success: false, error: "Not signed in." },
			{ status: 401 }
		);
	}

	const convexUser = await convexQuery<Doc<"users"> | null>("users:getUser", {
		email: requesterEmail
	});
	if (convexUser?.role !== "committee") {
		return NextResponse.json(
			{ success: false, error: "Committee members only." },
			{ status: 403 }
		);
	}

	const { eventId } = body;
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

	let posterError: string | null = null;
	let attempts = 0;
	try {
		const poster = await generateFlyerPoster(event, openaiKey);
		attempts = poster.attempts;

		const convex = new ConvexHttpClient(convexUrl);
		const uploadUrl = await convex.mutation(api.events.generateUploadUrl, {
			requesterEmail,
			secret
		});
		const uploadRes = await fetch(uploadUrl, {
			method: "POST",
			headers: { "Content-Type": "image/jpeg" },
			body: poster.jpeg
		});
		if (!uploadRes.ok) {
			throw new Error(`Convex storage upload failed with ${uploadRes.status}`);
		}
		const { storageId } = await uploadRes.json();

		await convex.mutation(api.events.setEventImage, {
			id: eventId as Id<"events">,
			storageId,
			updaterEmail: requesterEmail,
			secret
		});
	} catch (error) {
		console.error("Error designing flyer poster:", error);
		posterError = "The AI flyer design failed.";
	}

	let emailed = false;
	if (body.emailPrinter === true) {
		const missingEmail = missingFlyerEmailEnv();
		if (missingEmail.length > 0) {
			console.error(`Flyer email misconfigured - missing: ${missingEmail.join(", ")}`);
		} else {
			try {
				await emailFlyerToPrinter(event, request.url);
				emailed = true;
			} catch (error) {
				console.error("Error emailing flyer after design:", error);
			}
		}
	}

	return NextResponse.json(
		{ success: posterError === null, error: posterError, attempts, emailed },
		{ status: posterError === null ? 200 : 502 }
	);
}
