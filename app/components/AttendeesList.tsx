"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { motion } from "framer-motion";
import Modal from "./ui/Modal";

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

	return (
		<Modal title={`Who's Going to ${eventTitle}`} onClose={onClose}>
			{attendees === undefined ? (
				<div className="flex items-center justify-center py-8">
					<div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
				</div>
			) : attendees.length === 0 ? (
				<div className="text-center py-8">
					<div className="w-12 h-12 mx-auto mb-3 rounded-full bg-surface-2 flex items-center justify-center">
						<svg
							className="w-6 h-6 text-ink-muted"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
							/>
						</svg>
					</div>
					<p className="text-ink-muted">No one has RSVP&apos;d yet.</p>
					<p className="text-ink-faint text-sm mt-1">
						Be the first to sign up!
					</p>
				</div>
			) : (
				<>
					<p className="text-sm text-ink-muted mb-4">
						{attendees.length} {attendees.length === 1 ? "person" : "people"}{" "}
						going
					</p>
					<ul className="space-y-2">
						{attendees.map((attendee, index) => (
							<motion.li
								key={attendee._id}
								initial={{ opacity: 0, x: -10 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: index * 0.05 }}
								className="flex items-center gap-3 p-3 rounded-lg bg-surface-2"
							>
								<div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-fg font-medium text-sm flex-shrink-0">
									{attendee.name.charAt(0).toUpperCase()}
								</div>
								<span className="text-ink">{attendee.name}</span>
							</motion.li>
						))}
					</ul>
				</>
			)}
		</Modal>
	);
}
