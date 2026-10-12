import { SITE_URL } from "@/app/config/site";
import { escapeHtml } from "@/app/utils/escapeHtml";

/**
 * The two emails the daily cron sends to people who RSVP'd with an email:
 * the day-before reminder and the day-after thank-you. Kept short and in big
 * type, because most readers are older and read them on a phone. Gmail and
 * Yahoo strip modern CSS, so the HTML is table-based with inline styles only
 * (same approach as receiptEmail.ts). Every interpolated value is escaped.
 */

export interface AttendeeEmailEvent {
	_id: string;
	title: string;
	date: string; // YYYY-MM-DD
	time: string;
	location: string;
}

export interface EmailContent {
	subject: string;
	text: string;
	html: string;
}

const SIGN_OFF = "- The Woodward Bluffs Activities Committee";
const BODY_STYLE =
	"font-family:Arial,Helvetica,sans-serif;font-size:18px;line-height:1.5;color:#3d3229;";

/**
 * "Saturday, October 18" from YYYY-MM-DD. Noon UTC formatted in UTC, so the
 * server's own zone (UTC on Vercel, Pacific on a laptop) can't shift the day.
 */
export function longDateLabel(date: string): string {
	return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
		weekday: "long",
		month: "long",
		day: "numeric",
		timeZone: "UTC"
	});
}

/** Takes already-safe HTML. */
function paragraph(html: string, padding = "20px 32px 8px 32px"): string {
	return `
					<tr>
						<td style="padding:${padding};${BODY_STYLE}">${html}</td>
					</tr>`;
}

function detail(value: string, bold = false): string {
	return `
					<tr>
						<td style="padding:4px 32px;font-family:Arial,Helvetica,sans-serif;font-size:20px;line-height:1.4;color:#3d3229;font-weight:${bold ? "bold" : "normal"};">${escapeHtml(value)}</td>
					</tr>`;
}

function bigButton(url: string, label: string): string {
	return `
					<tr>
						<td align="center" style="padding:20px 32px 8px 32px;">
							<a href="${escapeHtml(url)}" style="display:inline-block;background-color:#c2643f;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:bold;text-decoration:none;padding:16px 32px;border-radius:12px;">${escapeHtml(label)}</a>
						</td>
					</tr>`;
}

function emailShell(rows: string): string {
	return `<!doctype html>
<html>
<body style="margin:0;padding:0;background-color:#f6efe4;">
	<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6efe4;padding:24px 12px;">
		<tr>
			<td align="center">
				<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5d9c7;">
					<tr>
						<td align="center" style="background-color:#c2643f;padding:20px 24px;">
							<div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:bold;color:#ffffff;">Woodward Bluffs Activities</div>
						</td>
					</tr>${rows}
					<tr>
						<td style="padding:0 0 20px 0;"></td>
					</tr>
				</table>
				<div style="max-width:520px;padding:16px 8px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#7d6f63;">
					Sent by the Woodward Bluffs Activities Committee because you RSVP'd on our website.
				</div>
			</td>
		</tr>
	</table>
</body>
</html>`;
}

/**
 * Day before. Links to the event page, where they can change their headcount
 * or cancel - not the feedback form, which asked "did you make it?" about an
 * event that hadn't happened yet.
 */
export function reminderEmail(
	event: AttendeeEmailEvent,
	recipientName: string
): EmailContent {
	const dateLabel = longDateLabel(event.date);
	const eventUrl = `${SITE_URL}/events/${event._id}`;

	const text = [
		`Hi ${recipientName},`,
		``,
		`Just a friendly reminder that you're coming to this tomorrow:`,
		``,
		`  ${event.title}`,
		`  ${dateLabel} at ${event.time}`,
		`  ${event.location}`,
		``,
		`We're looking forward to seeing you there.`,
		``,
		`Need to change or cancel? Open your RSVP here: ${eventUrl}`,
		``,
		SIGN_OFF
	].join("\n");

	const html = emailShell(
		paragraph(
			`Hi ${escapeHtml(recipientName)},<br><br>Just a friendly reminder that you're coming to this <strong>tomorrow</strong>:`,
			"28px 32px 12px 32px"
		) +
			detail(event.title, true) +
			detail(`${dateLabel} at ${event.time}`) +
			detail(event.location) +
			paragraph("We're looking forward to seeing you there.") +
			bigButton(eventUrl, "See the event") +
			paragraph(
				"Need to change or cancel? Tap the button to open your RSVP.",
				"8px 32px 8px 32px"
			)
	);

	return { subject: `Reminder: ${event.title} is tomorrow`, text, html };
}

/**
 * Day after. We can't know who actually came, so it thanks everyone and asks
 * both groups; the "couldn't make it" answers are the ones the committee most
 * needs, and they only come if someone asks.
 */
export function thankYouEmail(
	event: AttendeeEmailEvent,
	recipientName: string
): EmailContent {
	const feedbackUrl = `${SITE_URL}/feedback/${event._id}`;
	const buttonLabel = "Tell us how it went - 2 quick questions";

	const text = [
		`Hi ${recipientName},`,
		``,
		`Thank you for signing up for ${event.title} yesterday.`,
		``,
		`If you came, we hope you had a good time. If something came up and you`,
		`couldn't make it, we're sorry we missed you.`,
		``,
		`Either way, would you tell us how it went? It's 2 quick questions,`,
		`no sign-in needed:`,
		feedbackUrl,
		``,
		`It really helps us plan the next one.`,
		``,
		SIGN_OFF
	].join("\n");

	const html = emailShell(
		paragraph(
			`Hi ${escapeHtml(recipientName)},<br><br>Thank you for signing up for <strong>${escapeHtml(event.title)}</strong> yesterday.`,
			"28px 32px 8px 32px"
		) +
			paragraph(
				"If you came, we hope you had a good time. If something came up and you couldn't make it, we're sorry we missed you."
			) +
			paragraph(
				"Either way, would you tell us how it went? No sign-in needed."
			) +
			bigButton(feedbackUrl, buttonLabel) +
			paragraph(
				"It really helps us plan the next one.",
				"8px 32px 8px 32px"
			)
	);

	return { subject: `How was ${event.title}?`, text, html };
}
