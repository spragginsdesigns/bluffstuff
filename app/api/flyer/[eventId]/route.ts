import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { generateFlyerImage } from "@/app/utils/flyer";

// next/og's Node runtime breaks on Windows (font path ERR_INVALID_URL);
// the edge runtime loads its bundled font correctly everywhere.
export const runtime = "edge";

export async function GET(
	_request: NextRequest,
	{ params }: { params: { eventId: string } }
) {
	const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
	if (!convexUrl) {
		return NextResponse.json(
			{ error: "NEXT_PUBLIC_CONVEX_URL is not configured." },
			{ status: 500 }
		);
	}

	try {
		const convex = new ConvexHttpClient(convexUrl);
		const event = await convex.query(api.events.getById, {
			id: params.eventId as Id<"events">
		});

		if (!event) {
			return NextResponse.json({ error: "Event not found." }, { status: 404 });
		}

		return await generateFlyerImage(event);
	} catch (error) {
		console.error("Error generating flyer image:", error);
		return NextResponse.json(
			{ error: "Failed to generate flyer." },
			{ status: 500 }
		);
	}
}
