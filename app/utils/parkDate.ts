import { parseTimeString } from "./calendar";

// The park is in Fresno. Servers (Vercel, cron) run in UTC, so anything that
// asks "what day is it?" has to resolve it in park time, or it flips a day
// early or late around midnight.
export const PARK_TIMEZONE = "America/Los_Angeles";

/** YYYY-MM-DD in `timeZone`, shifted by `offsetDays` (1 = tomorrow). */
export function localDateIn(timeZone: string, offsetDays = 0): string {
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

// Event dates are plain "YYYY-MM-DD" strings. Formatting them as UTC midnight
// in UTC gives the same weekday on the server and on every phone, so a
// server-rendered event page hydrates without a mismatch.
function parseDay(date: string): Date {
	const [y, m, d] = date.split("-").map(Number);
	return new Date(Date.UTC(y, m - 1, d));
}

/** "Saturday, October 18". Never relative: for text read later (shared links, previews). */
export function longDay(date: string): string {
	return parseDay(date).toLocaleDateString("en-US", {
		timeZone: "UTC",
		weekday: "long",
		month: "long",
		day: "numeric"
	});
}

/** Short month for date badges ("Oct"), stable across time zones. */
export function shortMonth(date: string): string {
	return parseDay(date).toLocaleDateString("en-US", {
		timeZone: "UTC",
		month: "short"
	});
}

/** Day of the month for date badges (18), stable across time zones. */
export function dayOfMonth(date: string): number {
	return parseDay(date).getUTCDate();
}

/** Whether `date` is today or tomorrow in park time. */
export function relativeDay(date: string): "today" | "tomorrow" | null {
	if (date === localDateIn(PARK_TIMEZONE)) return "today";
	if (date === localDateIn(PARK_TIMEZONE, 1)) return "tomorrow";
	return null;
}

/** "Today", "Tomorrow", or "Saturday, October 18". */
export function friendlyDay(date: string): string {
	const relative = relativeDay(date);
	if (relative === "today") return "Today";
	if (relative === "tomorrow") return "Tomorrow";
	return longDay(date);
}

function joinWhen(day: string, time: string): string {
	const trimmed = time.trim();
	return trimmed ? `${day} at ${trimmed}` : day;
}

/** "Today at 2:00 PM", "Tomorrow at 2:00 PM", or "Saturday, October 18 at 2:00 PM". */
export function friendlyWhen(date: string, time: string): string {
	return joinWhen(friendlyDay(date), time);
}

/** "Saturday, October 18 at 2:00 PM". Never relative. */
export function longWhen(date: string, time: string): string {
	return joinWhen(longDay(date), time);
}

// Events have no end time, so assume a generous one. Long enough that nobody
// loses the RSVP button while the event is still going.
const ASSUMED_EVENT_HOURS = 3;

function parkMinutesNow(): number {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: PARK_TIMEZONE,
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23"
	}).formatToParts(new Date());
	const part = (type: Intl.DateTimeFormatPartTypes) =>
		Number(parts.find((p) => p.type === type)?.value ?? 0);
	return part("hour") * 60 + part("minute");
}

/**
 * True once an event is over in park time: any earlier day, or today once
 * start + ASSUMED_EVENT_HOURS has passed. An unreadable time counts as not
 * over, so a typo never hides an event.
 */
export function hasEventEnded(date: string, time: string): boolean {
	const today = localDateIn(PARK_TIMEZONE);
	if (date !== today) return date < today;
	const start = parseTimeString(time);
	if (!start) return false;
	const endMinutes =
		start.hours * 60 + start.minutes + ASSUMED_EVENT_HOURS * 60;
	return parkMinutesNow() >= endMinutes;
}
