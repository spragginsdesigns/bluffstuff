"use client";

import { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { motion } from "framer-motion";

interface AttendeesListProps {
	eventId: Id<"events">;
	eventTitle: string;
	onClose: () => void;
}

export default function AttendeesList({
	eventId,
	eventTitle,
	onClose
}: AttendeesListProps) {
	const attendees = useQuery(api.rsvps.getByEvent, { eventId });

	useEffect(() => {
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = "unset";
		};
	}, []);

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				className="bg-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-700"
			>
				<div className="p-6">
					<div className="flex justify-between items-center mb-6">
						<h2 className="text-xl font-bold text-white">
							Who&apos;s Going to {eventTitle}
						</h2>
						<button
							onClick={onClose}
							className="text-gray-400 hover:text-white transition-colors p-1"
							aria-label="Close"
						>
							<svg
								className="h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>

					{attendees === undefined ? (
						<div className="flex items-center justify-center py-8">
							<div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
						</div>
					) : attendees.length === 0 ? (
						<div className="text-center py-8">
							<div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-700 flex items-center justify-center">
								<svg
									className="w-6 h-6 text-gray-400"
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
							</div>
							<p className="text-gray-400">No one has RSVP&apos;d yet.</p>
							<p className="text-gray-500 text-sm mt-1">
								Be the first to sign up!
							</p>
						</div>
					) : (
						<>
							<p className="text-sm text-gray-400 mb-4">
								{attendees.length}{" "}
								{attendees.length === 1 ? "person" : "people"} going
							</p>
							<ul className="space-y-2">
								{attendees.map((attendee, index) => (
									<motion.li
										key={attendee._id}
										initial={{ opacity: 0, x: -10 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: index * 0.05 }}
										className="flex items-center gap-3 p-3 rounded-lg bg-gray-700/50"
									>
										<div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
											{attendee.name.charAt(0).toUpperCase()}
										</div>
										<span className="text-gray-200">{attendee.name}</span>
									</motion.li>
								))}
							</ul>
						</>
					)}
				</div>
			</motion.div>
		</div>
	);
}
