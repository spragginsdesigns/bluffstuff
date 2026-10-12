import Link from "next/link";
import { buttonClasses } from "./ui/buttonStyles";

/**
 * Shown wherever an event link (flyer QR, feedback link, an old text) points
 * at an event that no longer exists or never did. A dead end with a way home
 * beats "Event not found" for residents who just scanned a flyer.
 * Plain module (no "use client") so server and client pages can both use it.
 */
export default function EventGone() {
	return (
		<div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center">
			<div className="max-w-xl">
				<h1 className="font-display text-3xl font-bold text-ink mb-3">
					This event isn&apos;t on the calendar anymore
				</h1>
				<p className="text-ink-muted text-lg mb-8">
					It may have been moved or cancelled. Here&apos;s everything coming
					up instead.
				</p>
				<Link href="/#events" className={buttonClasses("primary", "lg")}>
					See Upcoming Events
				</Link>
			</div>
		</div>
	);
}
