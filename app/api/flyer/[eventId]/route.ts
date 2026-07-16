import { NextRequest, NextResponse } from "next/server";
import { Doc } from "@/convex/_generated/dataModel";
import { generateFlyerImage } from "@/app/utils/flyer";
import { convexQuery } from "@/app/utils/convexServer";

// next/og's Node runtime breaks on Windows (font path ERR_INVALID_URL);
// the edge runtime loads its bundled font correctly everywhere.
export const runtime = "edge";

export async function GET(
	_request: NextRequest,
	{ params }: { params: { eventId: string } }
) {
	try {
		const event = await convexQuery<Doc<"events"> | null>("events:getById", {
			id: params.eventId
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
