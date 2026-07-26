"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { api } from "@/convex/_generated/api";
import { buttonClasses } from "./ui/buttonStyles";

const RECENT_EVENT_COUNT = 3;

/**
 * The on-site path into post-event feedback. The printed flyer's QR covers
 * people who saw the poster; this covers people who are already on the site.
 * Framed to invite no-shows too — they're the ones with the useful answer.
 */
export default function RecentEventsFeedback() {
	const localDate = new Date().toLocaleDateString("en-CA");
	const pastEvents = useQuery(api.events.listRecentPast, {
		localDate,
		limit: RECENT_EVENT_COUNT
	});

	if (!pastEvents?.length) {
		return null;
	}

	return (
		<section id="recent" className="py-12 md:py-16 scroll-mt-20">
			<div className="container mx-auto px-4 max-w-3xl">
				<div className="text-center mb-8">
					<h2 className="font-display text-3xl md:text-4xl font-semibold text-ink">
						How Did We Do?
					</h2>
					<p className="text-ink-muted mt-3 text-base md:text-lg leading-relaxed">
						Came along, or couldn&apos;t make it? Both are worth telling us —
						especially the second one.
					</p>
				</div>

				<div className="space-y-3">
					{pastEvents.map((event, index) => {
						const eventDate = new Date(
							event.date + "T00:00:00"
						).toLocaleDateString("en-US", {
							weekday: "short",
							month: "long",
							day: "numeric"
						});

						return (
							<motion.div
								key={event._id}
								initial={{ opacity: 0, y: 10 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ delay: index * 0.08 }}
								className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-2xl bg-surface border border-border shadow-card"
							>
								<div className="min-w-0">
									<h3 className="text-ink font-semibold text-lg leading-snug">
										{event.title}
									</h3>
									<p className="text-ink-muted text-base mt-0.5">{eventDate}</p>
								</div>
								<Link
									href={`/feedback/${event._id}`}
									className={buttonClasses("outline", "md", "flex-shrink-0")}
								>
									Tell Us What You Think
								</Link>
							</motion.div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
