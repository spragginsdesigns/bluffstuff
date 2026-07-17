"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import EventCard from "./components/EventCard";
import Hero from "./components/Hero";
import MonthlyCalendar from "./components/MonthlyCalendar";
import CommitteeDashboard from "./components/CommitteeDashboard";
import FAQ from "./components/FAQ";
import ContactForm from "./components/ContactForm";
import Button from "./components/ui/Button";
import { ConvexEvent } from "../types/Event";
import { motion } from "framer-motion";
import { useIsCommittee } from "./hooks/useIsCommittee";
import { COMMITTEE_MEMBERS } from "./data/committee";
import { scrollToSection } from "./utils/scroll";

const EVENTS_PREVIEW_COUNT = 6;

export default function Home() {
	const { isCommittee, isLoaded } = useIsCommittee();
	const localDate = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in user's timezone
	const upcomingEventsRaw = useQuery(api.events.listUpcoming, { localDate });
	// Treat undefined (still loading / connection issue) as empty so the page doesn't spin forever
	const upcomingEvents = upcomingEventsRaw ?? [];
	const [showAllEvents, setShowAllEvents] = useState(false);

	if (!isLoaded) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
			</div>
		);
	}

	const hasMoreEvents = upcomingEvents.length > EVENTS_PREVIEW_COUNT;
	const visibleEvents = showAllEvents
		? upcomingEvents
		: upcomingEvents.slice(0, EVENTS_PREVIEW_COUNT);
	const hiddenCount = upcomingEvents.length - EVENTS_PREVIEW_COUNT;
	const nextEvent = (upcomingEvents[0] as ConvexEvent | undefined) ?? null;

	return (
		<main className="min-h-screen">
			<Hero nextEvent={nextEvent} />

			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.5 }}
			>
				{/* Committee Dashboard - only visible to committee members */}
				{isCommittee && <CommitteeDashboard />}

				{/* Events Section */}
				<section
					id="events"
					className="container mx-auto px-4 py-12 md:py-16 scroll-mt-20"
				>
					<div className="text-center mb-8">
						<h2 className="font-display text-3xl md:text-4xl font-semibold text-ink">
							Upcoming Events
						</h2>
						<p className="text-ink-muted mt-2 text-base md:text-lg">
							Don&apos;t miss out on community gatherings
						</p>
					</div>

					{upcomingEvents.length === 0 ? (
						<div className="text-center py-12">
							<div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-2 flex items-center justify-center">
								<svg
									className="w-8 h-8 text-ink-faint"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-hidden="true"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
									/>
								</svg>
							</div>
							<p className="text-ink-muted text-lg">
								No upcoming events right now
							</p>
							<p className="text-ink-faint text-base mt-1">
								Check back soon — we&apos;re always planning something fun!
							</p>
						</div>
					) : (
						<>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								{visibleEvents.map((event, index) => (
									<motion.div
										key={event._id}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: index * 0.1 }}
									>
										<EventCard event={event as ConvexEvent} />
									</motion.div>
								))}
							</div>

							{hasMoreEvents && (
								<div className="flex justify-center mt-8">
									<Button
										variant="outline"
										onClick={() => {
											if (showAllEvents) {
												setShowAllEvents(false);
												scrollToSection("events");
											} else {
												setShowAllEvents(true);
											}
										}}
									>
										{showAllEvents
											? "Show Less"
											: `Show More Events (${hiddenCount} more)`}
									</Button>
								</div>
							)}
						</>
					)}
				</section>

				{/* Monthly Calendar */}
				<section
					id="calendar"
					className="container mx-auto px-4 py-8 md:py-12 scroll-mt-20"
				>
					<div className="bg-surface-2/60 rounded-3xl p-5 md:p-8 border border-border max-w-4xl mx-auto">
						<h2 className="font-display text-3xl md:text-4xl font-semibold mb-2 text-center text-ink">
							This Month at the Bluffs
						</h2>
						<p className="text-ink-muted text-center mb-6 text-base">
							Tap a day or an event to see the details
						</p>
						<MonthlyCalendar
							events={upcomingEvents as ConvexEvent[]}
							onEventClick={() => {
								scrollToSection("events");
							}}
						/>
					</div>
				</section>

				{/* About the Committee */}
				<section id="committee" className="py-12 md:py-16 scroll-mt-20">
					<div className="container mx-auto px-4 max-w-4xl">
						<h2 className="font-display text-3xl md:text-4xl font-semibold mb-4 text-center text-ink">
							Meet Your Activities Committee
						</h2>
						<p className="text-ink-muted text-center mb-10 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
							We&apos;re your neighbors — and we love bringing the community
							together through fun events and activities. Say hi when you see
							us around the park!
						</p>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
							{COMMITTEE_MEMBERS.map((member, index) => (
								<motion.div
									key={member.name}
									initial={{ opacity: 0, y: 15 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.1 }}
									className="p-5 rounded-2xl bg-surface border border-border shadow-card hover:border-primary/40 transition-all duration-300"
								>
									<div className="flex items-center gap-3 mb-2">
										<div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-primary-fg font-bold text-lg flex-shrink-0">
											{member.name.charAt(0)}
										</div>
										<div>
											<h3 className="text-ink font-semibold text-base">
												{member.name}
											</h3>
											<p className="text-accent-strong text-sm font-medium">
												{member.role}
											</p>
										</div>
									</div>
									<p className="text-ink-muted text-sm">
										{member.description}
									</p>
								</motion.div>
							))}
						</div>

						{/* Join CTA */}
						<div className="text-center bg-primary-soft rounded-2xl p-6 md:p-8 border border-primary/20">
							<h3 className="font-display text-xl md:text-2xl font-bold text-ink mb-3">
								Want to Join the Committee?
							</h3>
							<p className="text-ink-muted mb-2 text-sm md:text-base">
								We&apos;re always looking for enthusiastic residents to help
								plan events and make our community even better!
							</p>
							<p className="text-ink-muted text-sm mb-6">
								Meetings are held the first Monday of every month.
							</p>
							<Button onClick={() => scrollToSection("contact")}>
								Get in Touch
							</Button>
						</div>
					</div>
				</section>

				{/* FAQ */}
				<FAQ />

				{/* Contact Form */}
				<ContactForm />
			</motion.div>
		</main>
	);
}
