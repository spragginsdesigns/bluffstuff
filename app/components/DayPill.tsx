import { relativeDay } from "../utils/parkDate";

/**
 * A loud "TODAY" / "TOMORROW" tag. A date like "Oct 18" makes people do the
 * math; this answers "is it soon?" at a glance. Renders nothing otherwise.
 */
export default function DayPill({ date }: { date: string }) {
	const relative = relativeDay(date);
	if (!relative) return null;
	return (
		<span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-sm font-bold uppercase tracking-wide text-accent-fg">
			{relative}
		</span>
	);
}
