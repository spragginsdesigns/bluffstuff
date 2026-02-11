"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ConvexEvent } from "@/types/Event";
import RsvpModal from "./RsvpModal";
import AttendeesList from "./AttendeesList";
import { motion } from "framer-motion";

interface EventCardProps {
	event: ConvexEvent;
}

export default function EventCard({ event }: EventCardProps) {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isAttendeesListOpen, setIsAttendeesListOpen] = useState(false);

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
		<>
			<motion.div
				whileHover={{ y: -4 }}
				transition={{ duration: 0.2 }}
				className="bg-gray-800/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg border border-gray-700/50 hover:border-purple-500/30 transition-all duration-300 hover:shadow-purple-500/10 hover:shadow-2xl"
			>
				<div className="p-5">
					<div className="flex items-start justify-between mb-3">
						<h3 className="text-xl font-bold text-white">{event.title}</h3>
						<div className="flex items-center gap-2 flex-shrink-0 ml-3">
							{rsvpCount !== undefined && rsvpCount > 0 && (
								<div className="bg-purple-500/80 backdrop-blur-sm rounded-full px-3 py-1 text-sm text-white font-medium">
									{rsvpCount} going
								</div>
							)}
							<div className="bg-black/40 backdrop-blur-md rounded-xl px-3 py-2 text-center border border-white/10">
								<div className="text-xs text-purple-300 font-medium uppercase">
									{eventDate.toLocaleDateString("en-US", { month: "short" })}
								</div>
								<div className="text-2xl text-white font-bold leading-none">
									{eventDate.getDate()}
								</div>
							</div>
						</div>
					</div>

					{/* Time & Location */}
					<div className="flex flex-col gap-1.5 mb-3 text-sm">
						<div className="flex items-center gap-2 text-gray-300">
							<svg
								className="w-4 h-4 text-purple-400 flex-shrink-0"
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
							{formattedDate} at {event.time}
						</div>
						<div className="flex items-center gap-2 text-gray-300">
							<svg
								className="w-4 h-4 text-pink-400 flex-shrink-0"
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
							{event.location}
						</div>
					</div>

					<p className="text-gray-400 text-sm mb-4 line-clamp-2">
						{event.description}
					</p>

					<div className="flex gap-3">
						<button
							onClick={() => setIsModalOpen(true)}
							className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-all duration-300 text-sm"
						>
							RSVP Now
						</button>
						<button
							onClick={() => setIsAttendeesListOpen(true)}
							className="px-4 py-2.5 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:border-gray-500 transition-all duration-300 text-sm"
						>
							Who&apos;s Going?
						</button>
					</div>
				</div>
			</motion.div>

			{isModalOpen && (
				<RsvpModal
					eventId={event._id}
					eventTitle={event.title}
					eventDate={event.date}
					eventTime={event.time}
					eventLocation={event.location}
					onClose={() => setIsModalOpen(false)}
				/>
			)}
			{isAttendeesListOpen && (
				<AttendeesList
					eventId={event._id}
					eventTitle={event.title}
					onClose={() => setIsAttendeesListOpen(false)}
				/>
			)}
		</>
	);
}
