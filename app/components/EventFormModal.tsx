"use client";

import { useState, useEffect } from "react";
import { ConvexEvent } from "@/types/Event";
import { motion } from "framer-motion";

interface EventFormModalProps {
	onClose: () => void;
	editEvent?: ConvexEvent | null;
}

export default function EventFormModal({
	onClose,
	editEvent
}: EventFormModalProps) {
	const [title, setTitle] = useState(editEvent?.title ?? "");
	const [description, setDescription] = useState(
		editEvent?.description ?? ""
	);
	const [date, setDate] = useState(editEvent?.date ?? "");
	const [time, setTime] = useState(editEvent?.time ?? "");
	const [location, setLocation] = useState(editEvent?.location ?? "");
	const [status, setStatus] = useState<
		"idle" | "submitting" | "success" | "error"
	>("idle");
	const [flyerStatus, setFlyerStatus] = useState<
		"idle" | "sending" | "sent" | "failed"
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
			if (editEvent) {
				const res = await fetch("/api/events", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						action: "update",
						id: editEvent._id,
						title,
						description,
						date,
						time,
						location
					})
				});
				if (!res.ok) {
					const data = await res.json().catch(() => null);
					throw new Error(data?.error ?? "Failed to update event");
				}
				setStatus("success");
				setTimeout(onClose, 1000);
			} else {
				const res = await fetch("/api/events", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						action: "create",
						title,
						description,
						date,
						time,
						location
					})
				});
				if (!res.ok) {
					const data = await res.json().catch(() => null);
					throw new Error(data?.error ?? "Failed to create event");
				}
				const { eventId: newEventId } = await res.json();
				setStatus("success");
				// Auto-email the flyer to the printer; failure never blocks creation
				setFlyerStatus("sending");
				try {
					const res = await fetch("/api/sendFlyer", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ eventId: newEventId })
					});
					setFlyerStatus(res.ok ? "sent" : "failed");
				} catch {
					setFlyerStatus("failed");
				}
				setTimeout(onClose, 2000);
			}
		} catch (err) {
			setStatus("error");
			setErrorMessage(
				err instanceof Error ? err.message : "Something went wrong"
			);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				className="bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-700"
			>
				<div className="p-6">
					<div className="flex justify-between items-center mb-6">
						<h2 className="text-2xl font-bold text-white">
							{editEvent ? "Edit Event" : "Create Event"}
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

					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-300 mb-1">
								Event Title
							</label>
							<input
								type="text"
								required
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="e.g. Community Potluck"
								className="w-full px-4 py-2.5 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-300 mb-1">
								Description
							</label>
							<textarea
								required
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								rows={3}
								placeholder="Make it sound fun! What should people expect?"
								className="w-full px-4 py-2.5 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-1">
									Date
								</label>
								<input
									type="date"
									required
									value={date}
									onChange={(e) => setDate(e.target.value)}
									className="w-full px-4 py-2.5 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-1">
									Time
								</label>
								<input
									type="text"
									required
									value={time}
									onChange={(e) => setTime(e.target.value)}
									placeholder="e.g. 6:00 PM"
									className="w-full px-4 py-2.5 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
								/>
							</div>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-300 mb-1">
								Location
							</label>
							<input
								type="text"
								required
								value={location}
								onChange={(e) => setLocation(e.target.value)}
								placeholder="e.g. Community Clubhouse"
								className="w-full px-4 py-2.5 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
							/>
						</div>

						{status === "success" && (
							<motion.div
								initial={{ opacity: 0, y: 5 }}
								animate={{ opacity: 1, y: 0 }}
								className="p-3 rounded-lg bg-green-500/20 border border-green-500 text-green-400 text-sm"
							>
								Event {editEvent ? "updated" : "created"} successfully!
								{flyerStatus === "sending" && (
									<span className="block mt-1 text-green-300/80">
										Emailing the flyer to the printer…
									</span>
								)}
								{flyerStatus === "sent" && (
									<span className="block mt-1 text-green-300/80">
										Flyer emailed to the printer ✓
									</span>
								)}
								{flyerStatus === "failed" && (
									<span className="block mt-1 text-yellow-400">
										Flyer email didn&apos;t send — use the Flyer button on the
										event to print or resend it.
									</span>
								)}
							</motion.div>
						)}

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
								{status === "submitting"
									? "Saving..."
									: editEvent
										? "Update Event"
										: "Create Event"}
							</button>
						</div>
					</form>
				</div>
			</motion.div>
		</div>
	);
}
