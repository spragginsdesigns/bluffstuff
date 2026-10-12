import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { Doc } from "@/convex/_generated/dataModel";
import { convexQuery } from "@/app/utils/convexServer";
import {
	emailFlyerToPrinter,
	missingFlyerEmailEnv
} from "@/app/utils/flyerEmail";

export async function POST(request: NextRequest) {
	const missing = [
		!process.env.NEXT_PUBLIC_CONVEX_URL && "NEXT_PUBLIC_CONVEX_URL",
		...missingFlyerEmailEnv()
	].filter(Boolean);
	if (missing.length > 0) {
		console.error(`sendFlyer misconfigured - missing env vars: ${missing.join(", ")}`);
		return NextResponse.json(
			{ success: false, error: "Flyer email is not configured." },
			{ status: 500 }
		);
	}

	try {
		// Only signed-in committee members may trigger flyer emails
		const user = await currentUser();
		const senderEmail = user?.primaryEmailAddress?.emailAddress;
		if (!senderEmail) {
			return NextResponse.json(
				{ success: false, error: "Not signed in." },
				{ status: 401 }
			);
		}

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

		await emailFlyerToPrinter(event, request.url);

		return NextResponse.json({ success: true }, { status: 200 });
	} catch (error) {
		console.error("Error sending flyer email:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to send flyer email." },
			{ status: 500 }
		);
	}
}
