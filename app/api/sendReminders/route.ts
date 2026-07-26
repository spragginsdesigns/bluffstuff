import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { convexQuery } from "@/app/utils/convexServer";
import { SITE_URL, mailFrom, mailSenderAddress } from "@/app/config/site";

/**
 * Day-before event reminders, run by Vercel Cron (see vercel.json).
 *
 * Replaces a stub that took `{email, message}` and was called by nothing —
 * which is why residents never got reminded, and why "I didn't know about it"
 * and "I knew, but I forgot" are the top two no-show reasons in the feedback.
 *
 * Safety properties that matter here, because this thing emails real people:
 *  - Gated on CRON_SECRET. The route is public in middleware (a cron has no
 *    Clerk session), so this bearer check IS the authentication.
 *  - Idempotent. `events.reminderSentAt` is set after a send, and the query
 *    only returns events where it is unset, so a retry can't double-email.
 *  - Marks per-event, after that event's sends. A crash halfway through
 *    retries that whole event next run instead of skipping it silently.
 */

// The park is in Fresno; cron fires in UTC, so "tomorrow" has to be resolved
// in local time or reminders land a day early or late around midnight.
const PARK_TIMEZONE = "America/Los_Angeles";

function localDateIn(timeZone: string, offsetDays = 0): string {
	const now = new Date();
	const local = new Intl.DateTimeFormat("en-CA", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit"
	}).format(now);
	const [y, m, d] = local.split("-").map(Number);
	// Build in UTC so the arithmetic can't be shifted by the server's own zone
	const shifted = new Date(Date.UTC(y, m - 1, d));
	shifted.setUTCDate(shifted.getUTCDate() + offsetDays);
	return shifted.toISOString().split("T")[0];
}

interface DueEvent {
	_id: Id<"events">;
	title: string;
	date: string;
	time: string;
	location: string;
	recipients: { name: string; email: string }[];
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
		console.error(`sendReminders misconfigured — missing: ${missing}`);
		return NextResponse.json(
			{ success: false, error: "Reminders are not configured." },
			{ status: 500 }
		);
	}

	// This is the auth boundary — the route is public so the cron can reach it
	if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
		return NextResponse.json(
			{ success: false, error: "Unauthorized." },
			{ status: 401 }
		);
	}

	try {
		const targetDate = localDateIn(PARK_TIMEZONE, 1);
		const dueEvents = await convexQuery<DueEvent[]>("reminders:dueForReminder", {
			date: targetDate,
			secret: committeeSecret
		});

		if (dueEvents.length === 0) {
			return NextResponse.json(
				{ success: true, date: targetDate, events: 0, emailsSent: 0 },
				{ status: 200 }
			);
		}

		const transporter = nodemailer.createTransport({
			service: "gmail",
			auth: { user: gmailUser, pass: gmailAppPassword }
		});
		const convex = new ConvexHttpClient(convexUrl);

		const summary: { title: string; sent: number; failed: number }[] = [];
		let emailsSent = 0;

		for (const event of dueEvents) {
			let sent = 0;
			let failed = 0;

			for (const recipient of event.recipients) {
				try {
					await transporter.sendMail({
						// Residents see "Woodward Bluffs Activities", not a bare
						// personal Gmail address they won't recognise
						from: mailFrom(gmailUser),
						replyTo: mailSenderAddress(gmailUser),
						to: recipient.email,
						subject: `Tomorrow: ${event.title}`,
						text: [
							`Hi ${recipient.name},`,
							``,
							`Just a reminder that you're signed up for this tomorrow:`,
							``,
							`  ${event.title}`,
							`  ${event.time}`,
							`  ${event.location}`,
							``,
							`We're looking forward to seeing you there.`,
							``,
							`Can't make it after all? No problem at all — but if you have a`,
							`moment afterwards, let us know why so we can plan better:`,
							`${SITE_URL}/feedback/${event._id}`,
							``,
							`— The Woodward Bluffs Activities Committee`
						].join("\n")
					});
					sent++;
				} catch (error) {
					// One bad address must not stop the rest of the list
					failed++;
					console.error(`Reminder to ${recipient.email} failed:`, error);
				}
			}

			// Mark only after this event's sends, so a crash retries the event
			await convex.mutation(api.reminders.markReminded, {
				eventId: event._id,
				sentCount: sent,
				secret: committeeSecret
			});

			emailsSent += sent;
			summary.push({ title: event.title, sent, failed });
		}

		return NextResponse.json(
			{
				success: true,
				date: targetDate,
				events: dueEvents.length,
				emailsSent,
				summary
			},
			{ status: 200 }
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
