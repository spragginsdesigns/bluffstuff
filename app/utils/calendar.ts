interface CalendarEventInput {
	title: string;
	date: string; // YYYY-MM-DD
	time?: string; // e.g., "6:00 PM", "2:30 pm", "14:00"
	description: string;
	location?: string;
}

/**
 * Parse a time string like "6:00 PM", "2:30 pm", or "14:00" into hours and minutes.
 */
function parseTimeString(
	timeStr: string
): { hours: number; minutes: number } | null {
	const match12 = timeStr.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
	if (match12) {
		let hours = parseInt(match12[1], 10);
		const minutes = parseInt(match12[2], 10);
		const period = match12[3].toLowerCase();
		if (period === "pm" && hours !== 12) hours += 12;
		if (period === "am" && hours === 12) hours = 0;
		return { hours, minutes };
	}

	const match24 = timeStr.match(/(\d{1,2}):(\d{2})/);
	if (match24) {
		return {
			hours: parseInt(match24[1], 10),
			minutes: parseInt(match24[2], 10)
		};
	}

	return null;
}

/**
 * Build a local Date from "YYYY-MM-DD" and optional time string.
 * Falls back to noon local time if time is missing or unparseable.
 */
function buildEventDate(dateStr: string, timeStr?: string): Date {
	const [year, month, day] = dateStr.split("-").map(Number);
	const time = timeStr ? parseTimeString(timeStr) : null;
	return new Date(
		year,
		month - 1,
		day,
		time?.hours ?? 12,
		time?.minutes ?? 0
	);
}

/**
 * Format Date as YYYYMMDDTHHMMSS (no timezone suffix = floating local time).
 * Floating time means the event appears at that clock time in whichever
 * timezone the user's calendar is set to — correct for local community events.
 */
function formatCalendarDate(date: Date): string {
	const pad = (n: number) => n.toString().padStart(2, "0");
	return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

/**
 * Escape special characters for ICS text values per RFC 5545 Section 3.3.11.
 */
function escapeICSText(text: string): string {
	return text
		.replace(/\\/g, "\\\\")
		.replace(/;/g, "\\;")
		.replace(/,/g, "\\,")
		.replace(/\n/g, "\\n");
}

export const generateGoogleCalendarLink = (
	event: CalendarEventInput
): string => {
	const start = buildEventDate(event.date, event.time);
	const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

	const startStr = formatCalendarDate(start);
	const endStr = formatCalendarDate(end);

	const params = new URLSearchParams({
		action: "TEMPLATE",
		text: event.title,
		dates: `${startStr}/${endStr}`,
		details: event.description,
		location: event.location || "",
		sf: "true",
		output: "xml"
	});

	return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/**
 * Generate RFC 5545-compliant ICS file content.
 */
export function generateICSContent(event: CalendarEventInput): string {
	const start = buildEventDate(event.date, event.time);
	const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

	const startStr = formatCalendarDate(start);
	const endStr = formatCalendarDate(end);
	const stampStr =
		new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
	const uid = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}@bluffstuff.vercel.app`;

	const lines = [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"PRODID:-//BluffStuff//Events//EN",
		"CALSCALE:GREGORIAN",
		"METHOD:PUBLISH",
		"BEGIN:VEVENT",
		`UID:${uid}`,
		`DTSTAMP:${stampStr}`,
		`DTSTART:${startStr}`,
		`DTEND:${endStr}`,
		`SUMMARY:${escapeICSText(event.title)}`,
		`DESCRIPTION:${escapeICSText(event.description)}`,
		`LOCATION:${escapeICSText(event.location || "")}`,
		"END:VEVENT",
		"END:VCALENDAR"
	];

	return lines.join("\r\n");
}

/**
 * Trigger download of an .ics file using a Blob.
 * Works reliably on iOS Safari, Android Chrome, and all desktop browsers.
 */
export function downloadICSFile(event: CalendarEventInput): void {
	const content = generateICSContent(event);
	const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
	const url = URL.createObjectURL(blob);

	const link = document.createElement("a");
	link.href = url;
	link.download = `${event.title.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "-")}.ics`;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);

	setTimeout(() => URL.revokeObjectURL(url), 1000);
}
