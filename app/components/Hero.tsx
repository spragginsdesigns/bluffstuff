"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ConvexEvent } from "@/types/Event";
import RsvpModal from "./RsvpModal";

interface HeroProps {
	nextEvent: ConvexEvent | null;
}

const quickActions = [
	{
		label: "See Events",
		target: "events",
		icon: (
			<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={1.8}
					d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
				/>
			</svg>
		)
	},
	{
		label: "This Month",
		target: "calendar",
		icon: (
			<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={1.8}
					d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
		)
	},
	{
		label: "Suggest an Event",
		target: "contact",
		icon: (
			<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={1.8}
					d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
				/>
			</svg>
		)
	},
	{
		label: "Volunteer",
		target: "committee",
		icon: (
			<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={1.8}
					d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
				/>
			</svg>
		)
	}
];

export default function Hero({ nextEvent }: HeroProps) {
	const [isRsvpOpen, setIsRsvpOpen] = useState(false);
	const rsvpCount = useQuery(
		api.rsvps.getCountByEvent,
		nextEvent ? { eventId: nextEvent._id } : "skip"
	);

	const scrollTo = (id: string) => {
		document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
	};

	const eventDate = nextEvent ? new Date(nextEvent.date + "T00:00:00") : null;

	return (
		<section className="relative w-full overflow-hidden pt-16 pb-10 md:pt-24 md:pb-16">
			{/* Warm background glow */}
			<div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl" />
			<div className="absolute top-40 right-0 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl" />
			<div className="absolute bottom-0 left-1/3 w-72 h-72 bg-cyan-500/5 rounded-full blur-3xl" />

			<div className="container mx-auto px-4 relative z-10">
				<div className="flex flex-col lg:flex-row lg:items-center gap-10 lg:gap-14">
					{/* Left: headline + actions */}
					<div className="w-full lg:w-1/2 text-center lg:text-left">
						<motion.div
							initial={{ opacity: 0, y: 16 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5 }}
							className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6"
						>
							<Image
								src="/logo.png"
								alt=""
								width={22}
								height={22}
								className="rounded-full"
							/>
							<span className="text-sm text-gray-300 font-medium">
								Woodward Bluffs Activities Committee
							</span>
						</motion.div>

						<motion.h1
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6 }}
							className="text-4xl md:text-5xl lg:text-[3.4rem] font-extrabold leading-tight mb-5 text-white"
						>
							What&apos;s happening at{" "}
							<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400">
								Woodward Bluffs
							</span>
							?
						</motion.h1>

						<motion.p
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, delay: 0.1 }}
							className="text-lg md:text-xl mb-8 text-gray-300 max-w-xl mx-auto lg:mx-0 leading-relaxed"
						>
							Potlucks, parties, and get-togethers with your neighbors — find an
							event, RSVP in seconds, and we&apos;ll save you a seat.
						</motion.p>

						{/* Quick actions */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, delay: 0.2 }}
							className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto lg:mx-0"
						>
							{quickActions.map((action) => (
								<button
									key={action.label}
									onClick={() => scrollTo(action.target)}
									className="flex flex-col items-center justify-center gap-2 px-3 py-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 text-gray-200 hover:bg-white/10 hover:border-purple-400/40 hover:text-white transition-all duration-200 min-h-[92px]"
								>
									<span className="text-purple-300">{action.icon}</span>
									<span className="text-sm font-semibold leading-tight text-center">
										{action.label}
									</span>
								</button>
							))}
						</motion.div>
					</div>

					{/* Right: next event card */}
					<motion.div
						initial={{ opacity: 0, y: 24 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.15 }}
						className="w-full lg:w-1/2"
					>
						{nextEvent && eventDate ? (
							<div className="relative max-w-lg mx-auto lg:ml-auto">
								<div className="absolute -inset-1 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-3xl blur-lg" />
								<div className="relative bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-white/10 p-6 md:p-7 shadow-2xl">
									<div className="flex items-start justify-between gap-4 mb-4">
										<div>
											<p className="text-xs font-bold tracking-widest uppercase text-cyan-400 mb-2">
												Next Event
											</p>
											<h2 className="text-2xl md:text-3xl font-bold text-white leading-snug">
												{nextEvent.title}
											</h2>
										</div>
										<div className="flex-shrink-0 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl px-4 py-3 text-center shadow-lg shadow-purple-500/20">
											<div className="text-xs text-purple-100 font-semibold uppercase leading-none mb-1">
												{eventDate.toLocaleDateString("en-US", {
													month: "short"
												})}
											</div>
											<div className="text-3xl text-white font-extrabold leading-none">
												{eventDate.getDate()}
											</div>
										</div>
									</div>

									<div className="space-y-2 mb-5">
										<div className="flex items-center gap-2.5 text-gray-200">
											<svg
												className="w-5 h-5 text-purple-400 flex-shrink-0"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
												/>
											</svg>
											<span className="text-base">
												{eventDate.toLocaleDateString("en-US", {
													weekday: "long",
													month: "long",
													day: "numeric"
												})}{" "}
												at {nextEvent.time}
											</span>
										</div>
										<div className="flex items-center gap-2.5 text-gray-200">
											<svg
												className="w-5 h-5 text-pink-400 flex-shrink-0"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
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
											<span className="text-base">{nextEvent.location}</span>
										</div>
										{rsvpCount !== undefined && rsvpCount > 0 && (
											<div className="flex items-center gap-2.5 text-gray-200">
												<svg
													className="w-5 h-5 text-cyan-400 flex-shrink-0"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
													/>
												</svg>
												<span className="text-base">
													{rsvpCount}{" "}
													{rsvpCount === 1 ? "neighbor is" : "neighbors are"}{" "}
													going
												</span>
											</div>
										)}
									</div>

									<div className="flex flex-col sm:flex-row gap-3">
										<button
											onClick={() => setIsRsvpOpen(true)}
											className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-3.5 px-6 rounded-xl text-base transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25"
										>
											RSVP Now
										</button>
										<button
											onClick={() => scrollTo("events")}
											className="flex-1 sm:flex-initial bg-white/5 border border-white/10 text-white font-semibold py-3.5 px-6 rounded-xl text-base hover:bg-white/10 transition-all duration-300"
										>
											All Events
										</button>
									</div>
								</div>
							</div>
						) : (
							<div className="max-w-lg mx-auto lg:ml-auto bg-gray-900/60 backdrop-blur-xl rounded-3xl border border-white/10 p-8 text-center">
								<div className="w-14 h-14 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
									<svg
										className="w-7 h-7 text-purple-300"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={1.8}
											d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
										/>
									</svg>
								</div>
								<h2 className="text-xl font-bold text-white mb-2">
									New events are in the works!
								</h2>
								<p className="text-gray-400 mb-5">
									Have an idea for the next get-together? We&apos;d love to hear
									it.
								</p>
								<button
									onClick={() => scrollTo("contact")}
									className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold py-3 px-7 rounded-xl transition-all duration-300"
								>
									Suggest an Event
								</button>
							</div>
						)}
					</motion.div>
				</div>
			</div>

			{isRsvpOpen && nextEvent && (
				<RsvpModal
					eventId={nextEvent._id}
					eventTitle={nextEvent.title}
					eventDate={nextEvent.date}
					eventTime={nextEvent.time}
					eventLocation={nextEvent.location}
					onClose={() => setIsRsvpOpen(false)}
				/>
			)}
		</section>
	);
}
