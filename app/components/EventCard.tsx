"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ConvexEvent } from "@/types/Event";
import { motion } from "framer-motion";
import EventActions, { formatEventPrice } from "./EventActions";

interface EventCardProps {
	event: ConvexEvent;
}

export default function EventCard({ event }: EventCardProps) {
	const price = formatEventPrice(event.priceCents);
	const rsvpCount = useQuery(api.rsvps.getCountByEvent, {
		eventId: event._id
	});

	const eventDate = new Date(event.date + "T00:00:00");
	const formattedDate = eventDate.toLocaleDateString("en-US", {
		weekday: "short",
		month: "long",
		day: "numeric"
	});

	return (
		<motion.div
			whileHover={{ y: -4 }}
			transition={{ duration: 0.2 }}
			className="bg-surface rounded-2xl overflow-hidden shadow-card border border-border hover:border-primary/40 hover:shadow-lifted transition-all duration-300"
		>
			<div className="p-5 md:p-6">
				<div className="flex items-start justify-between gap-3 mb-4">
					<div className="flex-shrink-0 bg-primary rounded-2xl px-3.5 py-2.5 text-center shadow-card">
						<div className="text-xs text-primary-fg/90 font-semibold uppercase leading-none mb-1">
							{eventDate.toLocaleDateString("en-US", { month: "short" })}
						</div>
						<div className="text-2xl text-primary-fg font-extrabold leading-none">
							{eventDate.getDate()}
						</div>
					</div>
					<h3 className="flex-1 min-w-0 font-display text-xl md:text-2xl font-bold text-ink leading-snug">
						<Link
							href={`/events/${event._id}`}
							className="hover:text-primary-strong transition-colors"
						>
							{event.title}
						</Link>
					</h3>
					{rsvpCount !== undefined && rsvpCount > 0 && (
						<div className="flex-shrink-0 bg-accent-soft rounded-full px-3 py-1 text-sm text-accent-strong font-semibold whitespace-nowrap">
							{rsvpCount} going
						</div>
					)}
				</div>

				{/* Time & Location */}
				<div className="flex flex-col gap-2 mb-3 text-base">
					<div className="flex items-center gap-2.5 text-ink-muted">
						<svg
							className="w-5 h-5 text-primary flex-shrink-0"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						{formattedDate} at {event.time}
					</div>
					<div className="flex items-center gap-2.5 text-ink-muted">
						<svg
							className="w-5 h-5 text-primary flex-shrink-0"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
							/>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
							/>
						</svg>
						{event.location}
					</div>
					{price && (
						<div className="flex items-center gap-2.5 text-ink-muted">
							<svg
								className="w-5 h-5 text-primary flex-shrink-0"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							{`${price} per person - card or cash at the door`}
						</div>
					)}
				</div>

				<p className="text-ink-muted text-base mb-1 line-clamp-2 leading-relaxed">
					{event.description}
				</p>
				<Link
					href={`/events/${event._id}`}
					className="inline-flex items-center min-h-[44px] mb-2 text-base font-semibold text-primary-strong underline underline-offset-2"
				>
					See full details
				</Link>

				<EventActions event={event} />
			</div>
		</motion.div>
	);
}
