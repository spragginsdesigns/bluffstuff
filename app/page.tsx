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
import { ConvexEvent } from "../types/Event";
import { motion } from "framer-motion";
import { useIsCommittee } from "./hooks/useIsCommittee";

const EVENTS_PREVIEW_COUNT = 6;

export default function Home() {
	const { isCommittee, isLoaded } = useIsCommittee();
	const upcomingEventsRaw = useQuery(api.events.listUpcoming);
	// Treat undefined (still loading / connection issue) as empty so the page doesn't spin forever
	const upcomingEvents = upcomingEventsRaw ?? [];
	const [selectedEvent, setSelectedEvent] = useState<ConvexEvent | null>(null);
	const [showAllEvents, setShowAllEvents] = useState(false);

	if (!isLoaded) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
			</div>
		);
	}

	const scrollToContact = () => {
		document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
	};

	const hasMoreEvents = upcomingEvents.length > EVENTS_PREVIEW_COUNT;
	const visibleEvents = showAllEvents
		? upcomingEvents
		: upcomingEvents.slice(0, EVENTS_PREVIEW_COUNT);
	const hiddenCount = upcomingEvents.length - EVENTS_PREVIEW_COUNT;

	return (
		<main className="min-h-screen">
			<Hero />

			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.5 }}
			>
				{/* Committee Dashboard - only visible to committee members */}
				{isCommittee && <CommitteeDashboard />}

				{/* Events Section */}
				<section id="events" className="container mx-auto px-4 py-12 md:py-16">
					<h2 className="text-2xl md:text-3xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
						Upcoming Events
					</h2>

					{upcomingEvents.length === 0 ? (
						<div className="text-center py-12">
							<div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
								<svg
									className="w-8 h-8 text-gray-500"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
									/>
								</svg>
							</div>
							<p className="text-gray-400 text-lg">
								No upcoming events right now
							</p>
							<p className="text-gray-500 text-sm mt-1">
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
									<button
										onClick={() => {
											if (showAllEvents) {
												setShowAllEvents(false);
												document
													.getElementById("events")
													?.scrollIntoView({ behavior: "smooth" });
											} else {
												setShowAllEvents(true);
											}
										}}
										className="px-6 py-2.5 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:border-gray-500 transition-all duration-300 text-sm font-medium"
									>
										{showAllEvents
											? "Show Less"
											: `Show More Events (${hiddenCount} more)`}
									</button>
								</div>
							)}
						</>
					)}
				</section>

				{/* Monthly Calendar */}
				<section className="container mx-auto px-4 py-8 md:py-12">
					<div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-5 md:p-8 border border-gray-700/50 max-w-4xl mx-auto">
						<h2 className="text-2xl md:text-3xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
							Event Calendar
						</h2>
						<MonthlyCalendar
						events={upcomingEvents as ConvexEvent[]}
						onEventClick={(event) => {
							setSelectedEvent(event);
							document
								.getElementById("events")
								?.scrollIntoView({ behavior: "smooth" });
						}}
					/>
					</div>
				</section>

				{/* About the Committee */}
				<section
					id="committee"
					className="py-12 md:py-16 bg-gradient-to-br from-gray-900/50 to-gray-800/50"
				>
					<div className="container mx-auto px-4 max-w-4xl">
						<h2 className="text-2xl md:text-3xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
							Meet the Activities Committee
						</h2>
						<p className="text-gray-300 text-center mb-10 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
							We&apos;re a group of your neighbors who love bringing the
							community together through fun events and activities. Our goal is
							to make Woodward Bluffs the best place to live!
						</p>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
							{[
								{
									name: "Kathy",
									role: "Committee Leader",
									desc: "The heart and soul of our committee — keeps everything running smoothly"
								},
								{
									name: "Austin Spraggins",
									role: "Treasurer",
									desc: "Manages the budget so we can throw the best events possible"
								},
								{
									name: "Kim Anderson",
									role: "Committee Member",
									desc: "Helps coordinate events and gets the word out to the community"
								},
								{
									name: "Donnalee",
									role: "Committee Member",
									desc: "Our go-to helper — always stepping up wherever she's needed"
								}
							].map((member, index) => (
								<motion.div
									key={member.name}
									initial={{ opacity: 0, y: 15 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.1 }}
									className="p-5 rounded-2xl bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 hover:border-purple-500/30 transition-all duration-300"
								>
									<div className="flex items-center gap-3 mb-2">
										<div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
											{member.name.charAt(0)}
										</div>
										<div>
											<h3 className="text-white font-semibold">
												{member.name}
											</h3>
											<p className="text-purple-400 text-sm">{member.role}</p>
										</div>
									</div>
									<p className="text-gray-400 text-sm">{member.desc}</p>
								</motion.div>
							))}
						</div>

						{/* Join CTA */}
						<div className="text-center bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl p-6 md:p-8 border border-purple-500/20">
							<h3 className="text-xl md:text-2xl font-bold text-white mb-3">
								Want to Join the Committee?
							</h3>
							<p className="text-gray-300 mb-2 text-sm md:text-base">
								We&apos;re always looking for enthusiastic residents to help plan
								events and make our community even better!
							</p>
							<p className="text-gray-400 text-sm mb-6">
								Meetings are held the first Monday of every month.
							</p>
							<button
								onClick={scrollToContact}
								className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold hover:from-purple-600 hover:to-pink-700 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25"
							>
								Get in Touch
							</button>
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
