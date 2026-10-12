import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { convexQuery } from "@/app/utils/convexServer";
import { mailFrom, mailSenderAddress } from "@/app/config/site";
import { PARK_TIMEZONE, localDateIn } from "@/app/utils/parkDate";
import {
	EmailContent,
	reminderEmail,
	thankYouEmail
} from "@/app/utils/attendeeEmails";

/**
 * The daily attendee-email cron, run by Vercel Cron (see vercel.json):
 *  - a reminder to everyone who RSVP'd (with an email) to TOMORROW's events
 *  - a thank-you with the feedback link for YESTERDAY's events
 *
 * Replaces a stub that took `{email, message}` and was called by nothing,
 * which is why residents never got reminded, and why "I didn't know about it"
 * and "I knew, but I forgot" are the top two no-show reasons in the feedback.
 *
 * Safety properties that matter here, because this thing emails real people:
 *  - Gated on CRON_SECRET. The route is public in middleware (a cron has no
 *    Clerk session), so this bearer check IS the authentication.
 *  - Idempotent. `events.reminderSentAt` / `events.thankYouSentAt` are set
 *    after the sends, and the queries only return events where they're unset,
 *    so a retry can't double-email.
 *  - Marks per-event, after that event's sends. A crash halfway through
 *    retries that whole event next run instead of skipping it silently.
 *  - Never marks an event whose every send failed (e.g. a Gmail auth error),
 *    and answers 500 so the failure shows in Vercel's cron logs. A rerun the
 *    same day retries it; by the next day the date window has moved on.
 */

interface DueEvent {
	_id: Id<"events">;
	title: string;
	date: string;
	time: string;
	location: string;
	recipients: { name: string; email: string }[];
}

interface EventResult {
	title: string;
	sent: number;
	failed: number;
	marked: boolean;
}

/** Sends one kind of email for each due event, then marks the event. */
async function sendForEvents(
	kind: "reminder" | "thank-you",
	events: DueEvent[],
	compose: (event: DueEvent, recipientName: string) => EmailContent,
	markSent: (eventId: Id<"events">, sentCount: number) => Promise<unknown>,
	transporter: Transporter,
	gmailUser: string
): Promise<EventResult[]> {
	const results: EventResult[] = [];

	for (const event of events) {
		let sent = 0;
		let failed = 0;

		for (const recipient of event.recipients) {
			try {
				const { subject, text, html } = compose(event, recipient.name);
				await transporter.sendMail({
					// Residents see "Woodward Bluffs Activities", not a bare
					// personal Gmail address they won't recognise
					from: mailFrom(gmailUser),
					replyTo: mailSenderAddress(gmailUser),
					to: recipient.email,
					subject,
					text,
					html
				});
				sent++;
			} catch (error) {
				// One bad address must not stop the rest of the list
				failed++;
				console.error(`${kind} email to ${recipient.email} failed:`, error);
			}
		}

		// Everything failing means the transport is broken, not one address.
		// Marking would silently drop the whole event, so leave it for a rerun.
		// A partial failure is still marked: re-sending would double-email
		// everyone who already got it.
		const allFailed = event.recipients.length > 0 && sent === 0;
		if (allFailed) {
			console.error(
				`Every ${kind} email for "${event.title}" failed; left unmarked so a rerun retries it`
			);
		} else {
			await markSent(event._id, sent);
		}

		results.push({ title: event.title, sent, failed, marked: !allFailed });
	}

	return results;
}

async function handler(request: NextRequest) {
	const cronSecret = process.env.CRON_SECRET;
	const committeeSecret = process.env.COMMITTEE_API_SECRET;
	const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
	const gmailUser = process.env.GMAIL_USER;
	const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

	if (
		!cronSecret ||
		!committeeSecret ||
		!convexUrl ||
		!gmailUser ||
		!gmailAppPassword
	) {
		const missing = [
			!cronSecret && "CRON_SECRET",
			!committeeSecret && "COMMITTEE_API_SECRET",
			!convexUrl && "NEXT_PUBLIC_CONVEX_URL",
			!gmailUser && "GMAIL_USER",
			!gmailAppPassword && "GMAIL_APP_PASSWORD"
		]
			.filter(Boolean)
			.join(", ");
		console.error(`sendReminders misconfigured - missing: ${missing}`);
		return NextResponse.json(
			{ success: false, error: "Reminders are not configured." },
			{ status: 500 }
		);
	}

	// This is the auth boundary - the route is public so the cron can reach it
	if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
		return NextResponse.json(
			{ success: false, error: "Unauthorized." },
			{ status: 401 }
		);
	}

	try {
		const tomorrow = localDateIn(PARK_TIMEZONE, 1);
		const yesterday = localDateIn(PARK_TIMEZONE, -1);
		const [dueReminders, dueThankYous] = await Promise.all([
			convexQuery<DueEvent[]>("reminders:dueForReminder", {
				date: tomorrow,
				secret: committeeSecret
			}),
			convexQuery<DueEvent[]>("reminders:dueForThankYou", {
				date: yesterday,
				secret: committeeSecret
			})
		]);

		const transporter = nodemailer.createTransport({
			service: "gmail",
			auth: { user: gmailUser, pass: gmailAppPassword }
		});
		const convex = new ConvexHttpClient(convexUrl);

		const reminders = await sendForEvents(
			"reminder",
			dueReminders,
			reminderEmail,
			(eventId, sentCount) =>
				convex.mutation(api.reminders.markReminded, {
					eventId,
					sentCount,
					secret: committeeSecret
				}),
			transporter,
			gmailUser
		);
		const thankYous = await sendForEvents(
			"thank-you",
			dueThankYous,
			thankYouEmail,
			(eventId, sentCount) =>
				convex.mutation(api.reminders.markThanked, {
					eventId,
					sentCount,
					secret: committeeSecret
				}),
			transporter,
			gmailUser
		);

		const all = [...reminders, ...thankYous];
		const success = all.every((r) => r.marked);
		return NextResponse.json(
			{
				success,
				reminders: {
					date: tomorrow,
					events: reminders.length,
					emailsSent: reminders.reduce((n, r) => n + r.sent, 0),
					summary: reminders
				},
				thankYous: {
					date: yesterday,
					events: thankYous.length,
					emailsSent: thankYous.reduce((n, r) => n + r.sent, 0),
					summary: thankYous
				}
			},
			// Non-200 so Vercel flags the cron run when a whole event failed
			{ status: success ? 200 : 500 }
		);
	} catch (error) {
		console.error("Error sending reminders:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to send reminders." },
			{ status: 500 }
		);
	}
}

// Vercel Cron issues GET; POST is kept so it can be triggered manually too.
export const GET = handler;
export const POST = handler;
