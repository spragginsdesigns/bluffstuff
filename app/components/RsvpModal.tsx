"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import {
	generateGoogleCalendarLink,
	downloadICSFile
} from "../utils/calendar";

interface RsvpModalProps {
	eventId: Id<"events">;
	eventTitle: string;
	eventDate: string;
	eventTime: string;
	eventLocation: string;
	onClose: () => void;
}

export default function RsvpModal({
	eventId,
	eventTitle,
	eventDate,
	eventTime,
	eventLocation,
	onClose
}: RsvpModalProps) {
	const { user } = useUser();
	const createRsvp = useMutation(api.rsvps.create);

	const [name, setName] = useState(user?.fullName ?? "");
	const [email, setEmail] = useState(
		user?.primaryEmailAddress?.emailAddress ?? ""
	);
	const [phoneNumber, setPhoneNumber] = useState("");
	const [notes, setNotes] = useState("");
	const [status, setStatus] = useState<
		"idle" | "submitting" | "success" | "error"
	>("idle");
	const [errorMessage, setErrorMessage] = useState("");

	useEffect(() => {
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = "unset";
		};
	}, []);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setStatus("submitting");
		setErrorMessage("");

		try {
			await createRsvp({
				eventId,
				name,
				email,
				phoneNumber: phoneNumber || undefined,
				notes: notes || undefined
			});
			setStatus("success");
		} catch (err) {
			setStatus("error");
			setErrorMessage(
				err instanceof Error ? err.message : "Something went wrong"
			);
		}
	};

	const formattedDate = new Date(eventDate + "T00:00:00").toLocaleDateString(
		"en-US",
		{ weekday: "long", month: "long", day: "numeric", year: "numeric" }
	);

	const eventDetails = {
		title: eventTitle,
		date: eventDate,
		time: eventTime,
		description: `${eventTitle} at ${eventLocation}`,
		location: eventLocation
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				className="bg-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-700"
			>
				<div className="p-6">
					<div className="flex justify-between items-center mb-6">
						<h2 className="text-2xl font-bold text-white">
							RSVP for {eventTitle}
						</h2>
						<button
							onClick={onClose}
							className="text-gray-400 hover:text-white transition-colors p-1"
							aria-label="Close modal"
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

					{/* Event info banner */}
					<div className="mb-6 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-sm">
						<p className="text-purple-300 font-medium">{formattedDate}</p>
						<p className="text-gray-400">
							{eventTime} &middot; {eventLocation}
						</p>
					</div>

					{status === "success" ? (
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							className="text-center py-6"
						>
							<div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
								<svg
									className="w-8 h-8 text-green-400"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M5 13l4 4L19 7"
									/>
								</svg>
							</div>
							<h3 className="text-xl font-bold text-white mb-2">
								You&apos;re In!
							</h3>
							<p className="text-gray-400 mb-6">
								We&apos;ll see you at {eventTitle}!
							</p>

							{/* Calendar add buttons */}
							<div className="flex flex-col sm:flex-row gap-3 justify-center">
								<button
									type="button"
									onClick={() =>
										window.open(
											generateGoogleCalendarLink(eventDetails),
											"_blank"
										)
									}
									className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors text-sm font-medium"
								>
									Add to Google Calendar
								</button>
								<button
									type="button"
									onClick={() => downloadICSFile(eventDetails)}
									className="px-4 py-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-colors text-sm font-medium text-center"
								>
									Add to Apple/Outlook
								</button>
							</div>

							<button
								onClick={onClose}
								className="mt-6 px-6 py-2 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
							>
								Close
							</button>
						</motion.div>
					) : (
						<form onSubmit={handleSubmit} className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-1">
									Name
								</label>
								<input
									type="text"
									required
									value={name}
									onChange={(e) => setName(e.target.value)}
									className="w-full px-4 py-2.5 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-1">
									Email
								</label>
								<input
									type="email"
									required
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className="w-full px-4 py-2.5 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-1">
									Phone (optional)
								</label>
								<input
									type="tel"
									value={phoneNumber}
									onChange={(e) => setPhoneNumber(e.target.value)}
									className="w-full px-4 py-2.5 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-1">
									Notes (optional)
								</label>
								<textarea
									value={notes}
									onChange={(e) => setNotes(e.target.value)}
									rows={2}
									placeholder="e.g., Bringing a potluck dish"
									className="w-full px-4 py-2.5 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
								/>
							</div>

							{status === "error" && (
								<motion.div
									initial={{ opacity: 0, y: 5 }}
									animate={{ opacity: 1, y: 0 }}
									className="p-3 rounded-lg bg-red-500/20 border border-red-500 text-red-400 text-sm"
								>
									{errorMessage}
								</motion.div>
							)}

							<div className="flex justify-end gap-3 pt-2">
								<button
									type="button"
									onClick={onClose}
									className="px-5 py-2.5 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors font-medium"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={status === "submitting"}
									className="px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 text-white font-medium hover:from-purple-600 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{status === "submitting" ? "Submitting..." : "Confirm RSVP"}
								</button>
							</div>
						</form>
					)}
				</div>
			</motion.div>
		</div>
	);
}
