"use client";

import { useState } from "react";
import { ConvexEvent } from "@/types/Event";
import { motion } from "framer-motion";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Textarea from "./ui/Textarea";
import Field from "./ui/Field";

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
		<Modal
			title={editEvent ? "Edit Event" : "Create Event"}
			onClose={onClose}
			size="lg"
		>
			<form onSubmit={handleSubmit} className="space-y-4">
				<Field label="Event Title" htmlFor="event-title" required>
					<Input
						id="event-title"
						type="text"
						required
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder="e.g. Community Potluck"
					/>
				</Field>

				<Field label="Description" htmlFor="event-description" required>
					<Textarea
						id="event-description"
						required
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						rows={3}
						placeholder="Make it sound fun! What should people expect?"
					/>
				</Field>

				<div className="grid grid-cols-2 gap-4">
					<Field label="Date" htmlFor="event-date" required>
						<Input
							id="event-date"
							type="date"
							required
							value={date}
							onChange={(e) => setDate(e.target.value)}
						/>
					</Field>
					<Field label="Time" htmlFor="event-time" required>
						<Input
							id="event-time"
							type="text"
							required
							value={time}
							onChange={(e) => setTime(e.target.value)}
							placeholder="e.g. 6:00 PM"
						/>
					</Field>
				</div>

				<Field label="Location" htmlFor="event-location" required>
					<Input
						id="event-location"
						type="text"
						required
						value={location}
						onChange={(e) => setLocation(e.target.value)}
						placeholder="e.g. Community Clubhouse"
					/>
				</Field>

				{status === "success" && (
					<motion.div
						initial={{ opacity: 0, y: 5 }}
						animate={{ opacity: 1, y: 0 }}
						className="p-3 rounded-lg bg-accent-soft text-accent-strong text-sm"
					>
						Event {editEvent ? "updated" : "created"} successfully!
						{flyerStatus === "sending" && (
							<span className="block mt-1 opacity-80">
								Emailing the flyer to the printer…
							</span>
						)}
						{flyerStatus === "sent" && (
							<span className="block mt-1 opacity-80">
								Flyer emailed to the printer ✓
							</span>
						)}
						{flyerStatus === "failed" && (
							<span className="block mt-1 text-danger">
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
						className="p-3 rounded-lg bg-danger-soft text-danger text-sm"
					>
						{errorMessage}
					</motion.div>
				)}

				<div className="flex justify-end gap-3 pt-2">
					<Button variant="ghost" onClick={onClose}>
						Cancel
					</Button>
					<Button type="submit" disabled={status === "submitting"}>
						{status === "submitting"
							? "Saving..."
							: editEvent
								? "Update Event"
								: "Create Event"}
					</Button>
				</div>
			</form>
		</Modal>
	);
}
