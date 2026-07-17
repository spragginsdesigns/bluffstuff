"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Textarea from "./ui/Textarea";
import Field from "./ui/Field";
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
		<Modal title={`RSVP for ${eventTitle}`} onClose={onClose}>
			{/* Event info banner */}
			<div className="mb-6 p-3 rounded-lg bg-primary-soft text-sm">
				<p className="text-primary-strong font-medium">{formattedDate}</p>
				<p className="text-ink-muted">
					{eventTime} &middot; {eventLocation}
				</p>
			</div>

			{status === "success" ? (
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					className="text-center py-6"
				>
					<div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-soft flex items-center justify-center">
						<svg
							className="w-8 h-8 text-accent-strong"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M5 13l4 4L19 7"
							/>
						</svg>
					</div>
					<h3 className="font-display text-xl font-bold text-ink mb-2">
						You&apos;re In!
					</h3>
					<p className="text-ink-muted mb-6">
						We&apos;ll see you at {eventTitle}!
					</p>

					{/* Calendar add buttons */}
					<div className="flex flex-col sm:flex-row gap-3 justify-center">
						<Button
							variant="outline"
							onClick={() =>
								window.open(generateGoogleCalendarLink(eventDetails), "_blank")
							}
						>
							Add to Google Calendar
						</Button>
						<Button variant="outline" onClick={() => downloadICSFile(eventDetails)}>
							Add to Apple/Outlook
						</Button>
					</div>

					<Button variant="ghost" onClick={onClose} className="mt-6">
						Close
					</Button>
				</motion.div>
			) : (
				<form onSubmit={handleSubmit} className="space-y-4">
					<Field label="Name" htmlFor="rsvp-name" required>
						<Input
							id="rsvp-name"
							type="text"
							required
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
					</Field>
					<Field label="Email" htmlFor="rsvp-email" required>
						<Input
							id="rsvp-email"
							type="email"
							required
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
					</Field>
					<Field label="Phone (optional)" htmlFor="rsvp-phone">
						<Input
							id="rsvp-phone"
							type="tel"
							value={phoneNumber}
							onChange={(e) => setPhoneNumber(e.target.value)}
						/>
					</Field>
					<Field label="Notes (optional)" htmlFor="rsvp-notes">
						<Textarea
							id="rsvp-notes"
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							rows={2}
							placeholder="e.g., Bringing a potluck dish"
						/>
					</Field>

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
							{status === "submitting" ? "Submitting..." : "Confirm RSVP"}
						</Button>
					</div>
				</form>
			)}
		</Modal>
	);
}
