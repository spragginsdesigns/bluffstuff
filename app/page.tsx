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

export default function Home() {
	const { isCommittee, isLoaded } = useIsCommittee();
	const upcomingEventsRaw = useQuery(api.events.listUpcoming);
	// Treat undefined (still loading / connection issue) as empty so the page doesn't spin forever
	const upcomingEvents = upcomingEventsRaw ?? [];
	const [selectedEvent, setSelectedEvent] = useState<ConvexEvent | null>(null);

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
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{upcomingEvents.map((event, index) => (
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

				{/* Resources */}
				<section className="container mx-auto px-4 py-12 md:py-16">
					<div className="bg-gray-800/30 backdrop-blur-sm p-6 md:p-8 rounded-2xl border border-gray-700/50">
						<h2 className="text-2xl md:text-3xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
							Resident Resources
						</h2>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							{[
								{
									title: "Fresno Mobile Home Laws",
									description:
										"Learn about local regulations and your rights as a mobile home resident.",
									icon: (
										<svg
											className="w-6 h-6"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
											/>
										</svg>
									),
									links: [
										{
											label: "Your Rights as a Resident",
											url: "https://www.hcd.ca.gov/mmh/mac/your-rights-mobilehome-park-resident"
										},
										{
											label: "2026 CA Mobilehome Residency Law",
											url: "https://mhphoa.com/mrl/"
										},
										{
											label: "City of Fresno Mobilehome Parks",
											url: "https://www.fresno.gov/cityattorney/mobilehome-parks/"
										}
									]
								},
								{
									title: "Community Guidelines",
									description:
										"Access Woodward Bluffs community rules and guidelines.",
									icon: (
										<svg
											className="w-6 h-6"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
											/>
										</svg>
									)
								},
								{
									title: "Helpful Contacts",
									description:
										"Find important numbers and contacts for mobile home living in Fresno.",
									icon: (
										<svg
											className="w-6 h-6"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
											/>
										</svg>
									)
								}
							].map((resource, index) => (
								<motion.div
									key={index}
									initial={{ opacity: 0, y: 15 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.1 }}
									className="p-5 bg-gray-800/50 rounded-xl border border-gray-700/50 hover:border-gray-600 transition-all duration-200"
								>
									<div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-emerald-500/20 flex items-center justify-center text-blue-400 mb-3">
										{resource.icon}
									</div>
									<h3 className="text-lg font-semibold text-white mb-1">
										{resource.title}
									</h3>
									<p className="text-gray-400 text-sm">
										{resource.description}
									</p>
									{"links" in resource &&
										(resource as { links: { label: string; url: string }[] }).links && (
											<ul className="mt-3 space-y-1.5">
												{(resource as { links: { label: string; url: string }[] }).links.map(
													(link, linkIndex) => (
														<li key={linkIndex}>
															<a
																href={link.url}
																target="_blank"
																rel="noopener noreferrer"
																className="text-sm text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
															>
																{link.label} &rarr;
															</a>
														</li>
													)
												)}
											</ul>
										)}
								</motion.div>
							))}
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
