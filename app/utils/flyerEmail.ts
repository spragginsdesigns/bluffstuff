import nodemailer from "nodemailer";
import { Doc } from "@/convex/_generated/dataModel";
import { formatFlyerDate } from "./flyer";
import { SITE_URL, mailFrom } from "../config/site";

/** Env vars the printer email needs; returns the names that are missing. */
export function missingFlyerEmailEnv(): string[] {
	return [
		!process.env.GMAIL_USER && "GMAIL_USER",
		!process.env.GMAIL_APP_PASSWORD && "GMAIL_APP_PASSWORD",
		!process.env.FLYER_RECIPIENT_EMAIL && "FLYER_RECIPIENT_EMAIL"
	].filter((name): name is string => Boolean(name));
}

/**
 * Emails the current flyer PNG to FLYER_RECIPIENT_EMAIL. Shared by the
 * "Email to the Printer" button and the post-create poster flow. Callers
 * do their own auth; check `missingFlyerEmailEnv()` first.
 */
export async function emailFlyerToPrinter(
	event: Doc<"events">,
	requestUrl: string
): Promise<void> {
	const gmailUser = process.env.GMAIL_USER ?? "";
	const gmailAppPassword = process.env.GMAIL_APP_PASSWORD ?? "";
	const recipient = process.env.FLYER_RECIPIENT_EMAIL ?? "";
	const eventId = event._id;

	// The PNG is rendered by the edge route (next/og needs the edge
	// runtime); fetch it from our own origin, bypassing the data cache
	// so the email always carries the current flyer.
	const flyerResponse = await fetch(
		new URL(`/api/flyer/${eventId}`, requestUrl),
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
		from: mailFrom(gmailUser),
		to: recipient,
		subject: `Flyer ready to print: ${event.title}`,
		text: [
			`A new event was added to the BluffStuff website:`,
			``,
			`  ${event.title}`,
			`  ${dateLabel} at ${event.time}`,
			`  ${event.location}`,
			``,
			`The flyer is attached to this email - open it and print as many copies as you need.`,
			``,
			`You can also open it in your web browser and print from there:`,
			`${flyerPageUrl}`,
			``,
			`The QR code on the flyer takes residents straight to the website to see details and RSVP.`,
			``,
			`- BluffStuff (sent automatically when an event is created)`
		].join("\n"),
		attachments: [{ filename: `flyer-${slug}.png`, content: flyerPng }]
	});

	if (info.accepted.length === 0) {
		throw new Error("Email was not accepted by the mail server");
	}
}
