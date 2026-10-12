"use client";

import Link from "next/link";
import { buttonClasses } from "./components/ui/buttonStyles";

/**
 * Catches any page that crashes while rendering, so residents see a calm
 * message with a way forward instead of Next's bare error screen. Never show
 * `error.message` here: in production it is either hidden or full of
 * internals that would only worry people.
 */
export default function ErrorPage({
	reset
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center">
			<div className="max-w-xl">
				<h1 className="font-display text-3xl font-bold text-ink mb-3">
					Something went wrong on our end
				</h1>
				<p className="text-ink-muted text-lg mb-8">
					Please try again. If it keeps happening, the events list still
					works.
				</p>
				<div className="flex flex-col sm:flex-row gap-3 justify-center">
					<button
						type="button"
						onClick={reset}
						className={buttonClasses("primary", "lg")}
					>
						Try again
					</button>
					<Link href="/#events" className={buttonClasses("outline", "lg")}>
						See upcoming events
					</Link>
				</div>
			</div>
		</div>
	);
}
