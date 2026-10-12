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

		const image = await generateFlyerImage(event);

		// next/og defaults to `public, immutable, max-age=31536000`, which kept
		// phones, the CDN and link previews showing the old flyer for a year
		// after an event was edited. The URL never changes, so cache briefly:
		// the CDN serves it for 5 minutes, then revalidates in the background.
		const headers = new Headers(image.headers);
		headers.set(
			"Cache-Control",
			"public, max-age=0, s-maxage=300, stale-while-revalidate=86400"
		);
		return new Response(image.body, { status: image.status, headers });
	} catch (error) {
		console.error("Error generating flyer image:", error);
		return NextResponse.json(
			{ error: "Failed to generate flyer." },
			{ status: 500 }
		);
	}
}
