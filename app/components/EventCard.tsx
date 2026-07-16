"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ConvexEvent } from "@/types/Event";
import RsvpModal from "./RsvpModal";
import AttendeesList from "./AttendeesList";
import { motion } from "framer-motion";
import {
	generateGoogleCalendarLink,
	downloadICSFile
} from "../utils/calendar";

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

	const calendarEvent = {
		title: event.title,
		date: event.date,
		time: event.time,
		description: event.description,
		location: event.location
	};

	return (
		<>
			<motion.div
				whileHover={{ y: -4 }}
				transition={{ duration: 0.2 }}
				className="bg-gray-800/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg border border-gray-700/50 hover:border-purple-500/30 transition-all duration-300 hover:shadow-purple-500/10 hover:shadow-2xl"
			>
				<div className="p-5 md:p-6">
					<div className="flex items-start justify-between gap-3 mb-4">
						<div className="flex-shrink-0 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl px-3.5 py-2.5 text-center shadow-lg shadow-purple-500/15">
							<div className="text-xs text-purple-100 font-semibold uppercase leading-none mb-1">
								{eventDate.toLocaleDateString("en-US", { month: "short" })}
							</div>
							<div className="text-2xl text-white font-extrabold leading-none">
								{eventDate.getDate()}
							</div>
						</div>
						<h3 className="flex-1 text-xl md:text-2xl font-bold text-white leading-snug">
							{event.title}
						</h3>
						{rsvpCount !== undefined && rsvpCount > 0 && (
							<div className="flex-shrink-0 bg-cyan-500/15 border border-cyan-400/30 rounded-full px-3 py-1 text-sm text-cyan-300 font-semibold whitespace-nowrap">
								{rsvpCount} going
							</div>
						)}
					</div>

					{/* Time & Location */}
					<div className="flex flex-col gap-2 mb-3 text-base">
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
							{formattedDate} at {event.time}
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
							{event.location}
						</div>
					</div>

					<p className="text-gray-400 text-base mb-5 line-clamp-2 leading-relaxed">
						{event.description}
					</p>

					<div className="flex gap-3">
						<button
							onClick={() => setIsModalOpen(true)}
							className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 text-base"
						>
							RSVP Now
						</button>
						<button
							onClick={() => setIsAttendeesListOpen(true)}
							className="px-4 py-3 rounded-xl border border-gray-600 text-gray-200 hover:bg-gray-700/50 hover:border-gray-500 transition-all duration-300 text-base"
						>
							Who&apos;s Going?
						</button>
					</div>

					{/* Calendar Buttons */}
					<div className="flex gap-2 mt-3">
						<button
							onClick={() => {
								const link = generateGoogleCalendarLink(calendarEvent);
								window.open(link, "_blank", "noopener");
							}}
							className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm text-gray-300 hover:text-white bg-gray-700/40 hover:bg-gray-700/70 border border-gray-600/30 hover:border-gray-500/50 transition-all duration-200"
						>
							<svg className="w-4 h-4" viewBox="0 0 48 48">
								<path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
								<path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
								<path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
								<path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
							</svg>
							Google
						</button>
						<button
							onClick={() => downloadICSFile(calendarEvent)}
							className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm text-gray-300 hover:text-white bg-gray-700/40 hover:bg-gray-700/70 border border-gray-600/30 hover:border-gray-500/50 transition-all duration-200"
						>
							<svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
								<path d="M11.182.008C11.148-.03 9.923.023 8.857 1.18c-1.066 1.156-.902 2.482-.878 2.516s1.52.087 2.475-1.258.762-2.391.728-2.43m3.314 11.733c-.048-.096-2.325-1.234-2.113-3.422s1.675-2.789 1.698-2.854-.597-.79-1.254-1.157a3.7 3.7 0 0 0-1.563-.434c-.108-.003-.483-.095-1.254.116-.508.139-1.653.589-1.968.607-.316.018-1.256-.522-2.267-.665-.647-.125-1.333.131-1.824.328-.49.196-1.422.754-2.074 2.237-.652 1.482-.311 3.83-.067 4.56s.625 1.924 1.273 2.796c.576.984 1.34 1.667 1.659 1.899s1.219.386 1.843.067c.502-.308 1.408-.485 1.766-.472.357.013 1.061.154 1.782.539.571.197 1.111.115 1.652-.105.541-.221 1.324-1.059 2.238-2.758q.52-1.185.473-1.282"/>
							</svg>
							Apple / Outlook
						</button>
						<a
							href={`/flyer/${event._id}`}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm text-gray-300 hover:text-white bg-gray-700/40 hover:bg-gray-700/70 border border-gray-600/30 hover:border-gray-500/50 transition-all duration-200"
						>
							<svg
								className="w-4 h-4 text-orange-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-8 4h10a2 2 0 002-2V7.83a2 2 0 00-.59-1.42l-2.82-2.82A2 2 0 0013.17 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
								/>
							</svg>
							Flyer
						</a>
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
