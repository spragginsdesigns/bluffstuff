import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { convexQuery } from "@/app/utils/convexServer";

/**
 * Committee event writes. The browser can't hold COMMITTEE_API_SECRET,
 * so this Clerk-authenticated route verifies the caller's committee role
 * and injects the secret into the Convex mutations server-side.
 */

// Whole non-negative cents only; undefined leaves the stored value alone
function sanitizePriceCents(value: unknown): number | undefined {
	if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
		return undefined;
	}
	return Math.round(value);
}
export async function POST(request: NextRequest) {
	const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
	const secret = process.env.COMMITTEE_API_SECRET;

	if (!convexUrl || !secret) {
		const missing = [
			!convexUrl && "NEXT_PUBLIC_CONVEX_URL",
			!secret && "COMMITTEE_API_SECRET"
		]
			.filter(Boolean)
			.join(", ");
		console.error(`events route misconfigured — missing: ${missing}`);
		return NextResponse.json(
			{ success: false, error: "Event management is not configured." },
			{ status: 500 }
		);
	}

	try {
		const user = await currentUser();
		const email = user?.primaryEmailAddress?.emailAddress;
		if (!email) {
			return NextResponse.json(
				{ success: false, error: "Not signed in." },
				{ status: 401 }
			);
		}

		const convexUser = await convexQuery<Doc<"users"> | null>(
			"users:getUser",
			{ email }
		);
		if (convexUser?.role !== "committee") {
			return NextResponse.json(
				{ success: false, error: "Committee members only." },
				{ status: 403 }
			);
		}

		const body = await request.json();
		const { action } = body;
		const convex = new ConvexHttpClient(convexUrl);

		if (action === "create") {
			const { title, description, date, time, location } = body;
			if (!title || !description || !date || !time || !location) {
				return NextResponse.json(
					{ success: false, error: "All event fields are required." },
					{ status: 400 }
				);
			}
			const eventId = await convex.mutation(api.events.create, {
				title,
				description,
				date,
				time,
				location,
				priceCents: sanitizePriceCents(body.priceCents),
				createdBy: email,
				secret
			});
			return NextResponse.json({ success: true, eventId }, { status: 200 });
		}

		if (action === "update") {
			const { id, title, description, date, time, location } = body;
			if (!id) {
				return NextResponse.json(
					{ success: false, error: "id is required." },
					{ status: 400 }
				);
			}
			await convex.mutation(api.events.update, {
				id: id as Id<"events">,
				title,
				description,
				date,
				time,
				location,
				priceCents: sanitizePriceCents(body.priceCents),
				updaterEmail: email,
				secret
			});
			return NextResponse.json({ success: true }, { status: 200 });
		}

		if (action === "attendance") {
			const { id, attendanceCount, attendanceNote } = body;
			if (!id) {
				return NextResponse.json(
					{ success: false, error: "id is required." },
					{ status: 400 }
				);
			}
			const count = Number(attendanceCount);
			if (!Number.isInteger(count) || count < 0) {
				return NextResponse.json(
					{
						success: false,
						error: "Attendance must be a whole number of people."
					},
					{ status: 400 }
				);
			}
			await convex.mutation(api.events.setAttendance, {
				id: id as Id<"events">,
				attendanceCount: count,
				attendanceNote:
					typeof attendanceNote === "string" ? attendanceNote : undefined,
				updaterEmail: email,
				secret
			});
			return NextResponse.json({ success: true }, { status: 200 });
		}

		if (action === "archive") {
			const { id } = body;
			if (!id) {
				return NextResponse.json(
					{ success: false, error: "id is required." },
					{ status: 400 }
				);
			}
			await convex.mutation(api.events.archive, {
				id: id as Id<"events">,
				archiverEmail: email,
				secret
			});
			return NextResponse.json({ success: true }, { status: 200 });
		}

		return NextResponse.json(
			{ success: false, error: "Unknown action." },
			{ status: 400 }
		);
	} catch (error) {
		console.error("Error in events route:", error);
		return NextResponse.json(
			{ success: false, error: "Event operation failed." },
			{ status: 500 }
		);
	}
}
