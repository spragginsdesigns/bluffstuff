"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { ConvexEvent } from "@/types/Event";
import EventActions, {
	formatEventPrice
} from "@/app/components/EventActions";
import { buttonClasses } from "@/app/components/ui/buttonStyles";

interface EventDetailProps {
	event: ConvexEvent;
	isPast: boolean;
}

/** Big, plain, phone-first view of one event. Rendered by the server page. */
export default function EventDetail({ event, isPast }: EventDetailProps) {
	const rsvpCount = useQuery(api.rsvps.getCountByEvent, {
		eventId: event._id
	});
	const price = formatEventPrice(event.priceCents);
	const eventDate = new Date(event.date + "T00:00:00");

	return (
		<article className="max-w-xl mx-auto py-6 md:py-12">
			<Link
				href="/#events"
				className="inline-flex items-center gap-1 min-h-[44px] mb-4 text-base font-medium text-ink-muted hover:text-ink"
			>
				<span aria-hidden="true">&larr;</span> All events
			</Link>

			<div className="bg-surface rounded-3xl border border-border shadow-card p-5 md:p-8">
				<div className="flex items-center gap-4 mb-5">
					<div className="flex-shrink-0 bg-primary rounded-2xl px-4 py-3 text-center shadow-card">
						<div className="text-sm text-primary-fg/90 font-semibold uppercase leading-none mb-1">
							{eventDate.toLocaleDateString("en-US", { month: "short" })}
						</div>
						<div className="text-3xl text-primary-fg font-extrabold leading-none">
							{eventDate.getDate()}
						</div>
					</div>
					<h1 className="min-w-0 font-display text-3xl md:text-4xl font-bold text-ink leading-tight">
						{event.title}
					</h1>
				</div>

				<dl className="space-y-3 mb-6 text-lg">
					<div>
						<dt className="text-sm font-semibold uppercase tracking-wide text-ink-faint">
							When
						</dt>
						<dd className="text-ink">
							{eventDate.toLocaleDateString("en-US", {
								weekday: "long",
								month: "long",
								day: "numeric"
							})}{" "}
							at {event.time}
						</dd>
					</div>
					<div>
						<dt className="text-sm font-semibold uppercase tracking-wide text-ink-faint">
							Where
						</dt>
						<dd className="text-ink">{event.location}</dd>
					</div>
					<div>
						<dt className="text-sm font-semibold uppercase tracking-wide text-ink-faint">
							Cost
						</dt>
						<dd className="text-ink">
							{price
								? `${price} per person - card or cash at the door`
								: "Free"}
						</dd>
					</div>
					{rsvpCount !== undefined && rsvpCount > 0 && (
						<div>
							<dt className="text-sm font-semibold uppercase tracking-wide text-ink-faint">
								{isPast ? "RSVP'd" : "Going so far"}
							</dt>
							<dd className="text-ink">
								{rsvpCount} {rsvpCount === 1 ? "person" : "people"}
							</dd>
						</div>
					)}
				</dl>

				{event.description && (
					<p className="text-ink text-lg leading-relaxed whitespace-pre-line mb-6">
						{event.description}
					</p>
				)}

				{isPast ? (
					<div className="rounded-2xl bg-primary-soft border border-primary/20 p-5 text-center">
						<p className="font-display text-xl font-semibold text-ink mb-2">
							This one already happened
						</p>
						<p className="text-ink-muted mb-4">
							Whether you made it or not, tell us how it went. Two quick
							questions, no sign-in.
						</p>
						<Link
							href={`/feedback/${event._id}`}
							className={buttonClasses("primary", "lg", "w-full")}
						>
							Share Feedback
						</Link>
					</div>
				) : (
					<EventActions event={event} />
				)}
			</div>
		</article>
	);
}
