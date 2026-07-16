import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import nodemailer from "nodemailer";
import { Doc } from "@/convex/_generated/dataModel";
import { formatFlyerDate } from "@/app/utils/flyer";
import { convexQuery } from "@/app/utils/convexServer";
import { SITE_URL } from "@/app/config/site";

export async function POST(request: NextRequest) {
	const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
	const gmailUser = process.env.GMAIL_USER;
	const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
	const recipient = process.env.FLYER_RECIPIENT_EMAIL;

	if (!convexUrl || !gmailUser || !gmailAppPassword || !recipient) {
		const missing = [
			!convexUrl && "NEXT_PUBLIC_CONVEX_URL",
			!gmailUser && "GMAIL_USER",
			!gmailAppPassword && "GMAIL_APP_PASSWORD",
			!recipient && "FLYER_RECIPIENT_EMAIL"
		]
			.filter(Boolean)
			.join(", ");
		console.error(`sendFlyer misconfigured — missing env vars: ${missing}`);
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

		// The PNG is rendered by the edge route (next/og needs the edge
		// runtime); fetch it from our own origin, bypassing the data cache
		// so the email always carries the current flyer.
		const flyerResponse = await fetch(
			new URL(`/api/flyer/${eventId}`, request.url),
			{ cache: "no-store" }
		);
		if (!flyerResponse.ok) {
			throw new Error(`Flyer render failed with ${flyerResponse.status}`);
		}
		const flyerPng = Buffer.from(await flyerResponse.arrayBuffer());

		const slug =
			event.title
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/(^-|-$)/g, "") || "event";
		const dateLabel = formatFlyerDate(event.date);
		const flyerPageUrl = `${SITE_URL}/flyer/${eventId}`;

		const transporter = nodemailer.createTransport({
			service: "gmail",
			auth: { user: gmailUser, pass: gmailAppPassword }
		});

		const info = await transporter.sendMail({
			from: gmailUser,
			to: recipient,
			subject: `Flyer ready to print: ${event.title}`,
			text: [
				`A new event was added to the BluffStuff website:`,
				``,
				`  ${event.title}`,
				`  ${dateLabel} at ${event.time}`,
				`  ${event.location}`,
				``,
				`The flyer is attached to this email — open it and print as many copies as you need.`,
				``,
				`You can also open it in your web browser and print from there:`,
				`${flyerPageUrl}`,
				``,
				`The QR code on the flyer takes residents straight to the website to see details and RSVP.`,
				``,
				`— BluffStuff (sent automatically when an event is created)`
			].join("\n"),
			attachments: [
				{ filename: `flyer-${slug}.png`, content: flyerPng }
			]
		});

		if (info.accepted.length === 0) {
			throw new Error("Email was not accepted by the mail server");
		}

		return NextResponse.json({ success: true }, { status: 200 });
	} catch (error) {
		console.error("Error sending flyer email:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to send flyer email." },
			{ status: 500 }
		);
	}
}
