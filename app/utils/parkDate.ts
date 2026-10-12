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
