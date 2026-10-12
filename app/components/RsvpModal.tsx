"use client";

import { useEffect, useState } from "react";
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
import ConfirmButton from "./ui/ConfirmButton";
import { useSavedContact } from "../hooks/useSavedContact";
import {
	generateGoogleCalendarLink,
	downloadICSFile
} from "../utils/calendar";

/** This browser's existing RSVP, from `rsvps:myRsvp`. */
export interface ExistingRsvp {
	name: string;
	partySize: number;
	email?: string;
	phoneNumber?: string;
	notes?: string;
}

interface RsvpModalProps {
	eventId: Id<"events">;
	eventTitle: string;
	eventDate: string;
	eventTime: string;
	eventLocation: string;
	visitorId: string | undefined;
	existing: ExistingRsvp | null;
	onClose: () => void;
}

const PARTY_SIZES = [1, 2, 3, 4, 5, 6];

export default function RsvpModal({
	eventId,
	eventTitle,
	eventDate,
	eventTime,
	eventLocation,
	visitorId,
	existing,
	onClose
}: RsvpModalProps) {
	const { user, isLoaded } = useUser();
	const { contact: savedContact, save: saveContact, forget } =
		useSavedContact();
	const createRsvp = useMutation(api.rsvps.create);
	const cancelRsvp = useMutation(api.rsvps.cancel);

	// Fixed at open: `existing` updates live, so a fresh RSVP (or a cancel)
	// would otherwise flip the title and success copy mid-dialog.
	const [isEditing] = useState(existing !== null);
	const [name, setName] = useState(existing?.name ?? "");
	const [email, setEmail] = useState(existing?.email ?? "");
	const [phoneNumber, setPhoneNumber] = useState(existing?.phoneNumber ?? "");
	const [notes, setNotes] = useState(existing?.notes ?? "");
	const [partySize, setPartySize] = useState(existing?.partySize ?? 1);
	const [rememberMe, setRememberMe] = useState(true);
	const [hasTyped, setHasTyped] = useState(isEditing);
	const [status, setStatus] = useState<
		"idle" | "submitting" | "success" | "cancelled" | "error"
	>("idle");
	const [errorMessage, setErrorMessage] = useState("");

	// Pre-fill once the sources resolve (both arrive after first render):
	// details remembered on this phone first, then a signed-in profile.
	// Never overwrite anything the resident has already typed.
	useEffect(() => {
		if (hasTyped || savedContact === undefined || !isLoaded) return;
		const fallbackEmail = user?.primaryEmailAddress?.emailAddress ?? "";
		setName(savedContact.name || user?.fullName || "");
		setEmail(savedContact.email || fallbackEmail);
		setPhoneNumber(savedContact.phone);
	}, [hasTyped, savedContact, isLoaded, user]);

	const typed =
		<T,>(setter: (value: T) => void) =>
		(value: T) => {
			setHasTyped(true);
			setter(value);
		};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setStatus("submitting");
		setErrorMessage("");

		try {
			await createRsvp({
				eventId,
				name,
				email: email.trim() || undefined,
				phoneNumber: phoneNumber.trim() || undefined,
				notes: notes.trim() || undefined,
				partySize,
				visitorId
			});
			if (rememberMe) {
				saveContact({
					name: name.trim(),
					email: email.trim(),
					phone: phoneNumber.trim()
				});
			} else {
				forget();
			}
			setStatus("success");
		} catch (err) {
			setStatus("error");
			setErrorMessage(cleanConvexError(err));
		}
	};

	const handleCancel = async () => {
		if (!visitorId) return;
		try {
			await cancelRsvp({ eventId, visitorId });
			setStatus("cancelled");
		} catch (err) {
			setStatus("error");
			setErrorMessage(cleanConvexError(err));
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
		<Modal
			title={isEditing ? `Your RSVP: ${eventTitle}` : `RSVP for ${eventTitle}`}
			onClose={onClose}
		>
			{/* Event info banner */}
			<div className="mb-6 p-3 rounded-lg bg-primary-soft text-base">
				<p className="text-primary-strong font-semibold">{formattedDate}</p>
				<p className="text-ink-muted">
					{eventTime} &middot; {eventLocation}
				</p>
			</div>

			{status === "success" ? (
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					className="text-center py-4"
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
					<h3 className="font-display text-2xl font-bold text-ink mb-2">
						{isEditing ? "All set!" : "You're In!"}
					</h3>
					<p className="text-ink-muted mb-2">
						{partySize === 1
							? `We'll see you at ${eventTitle}!`
							: `We'll save room for ${partySize} at ${eventTitle}!`}
					</p>
					<p className="text-ink-muted text-sm mb-6">
						{email.trim()
							? "We'll email you a reminder the day before."
							: "Tip: add it to your calendar so you don't forget."}
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
			) : status === "cancelled" ? (
				<div className="text-center py-6">
					<h3 className="font-display text-2xl font-bold text-ink mb-2">
						Got it
					</h3>
					<p className="text-ink-muted mb-6">
						You&apos;re off the list for {eventTitle}. Thanks for letting us
						know. If plans change, you can RSVP again anytime.
					</p>
					<Button onClick={onClose}>Close</Button>
				</div>
			) : (
				<form onSubmit={handleSubmit} className="space-y-5">
					<p className="text-sm text-ink-muted">
						No account needed. Just your name and how many are coming.
					</p>

					<Field label="Your name" htmlFor="rsvp-name" required>
						<Input
							id="rsvp-name"
							type="text"
							required
							autoComplete="name"
							value={name}
							onChange={(e) => typed(setName)(e.target.value)}
						/>
					</Field>

					<fieldset>
						<legend className="block text-base font-medium text-ink mb-1.5">
							How many are coming, including you?
							<span className="text-danger ml-0.5" aria-hidden="true">
								*
							</span>
						</legend>
						<div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
							{PARTY_SIZES.map((size) => (
								<button
									key={size}
									type="button"
									onClick={() => setPartySize(size)}
									aria-pressed={partySize === size}
									aria-label={`${size} ${size === 1 ? "person" : "people"}`}
									className={`min-h-[52px] rounded-xl border-2 text-xl font-bold transition-colors ${
										partySize === size
											? "border-primary bg-primary text-primary-fg"
											: "border-border bg-surface-2 text-ink hover:border-primary/40"
									}`}
								>
									{size}
								</button>
							))}
						</div>
					</fieldset>

					<Field label="Email (optional)" htmlFor="rsvp-email">
						<Input
							id="rsvp-email"
							type="email"
							autoComplete="email"
							value={email}
							onChange={(e) => typed(setEmail)(e.target.value)}
						/>
						<p className="text-sm text-ink-muted mt-1.5">
							Add it and we&apos;ll email you a reminder the day before.
						</p>
					</Field>
					<Field label="Phone (optional)" htmlFor="rsvp-phone">
						<Input
							id="rsvp-phone"
							type="tel"
							autoComplete="tel"
							value={phoneNumber}
							onChange={(e) => typed(setPhoneNumber)(e.target.value)}
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

					<label className="flex items-center gap-3 text-base text-ink cursor-pointer">
						<input
							type="checkbox"
							checked={rememberMe}
							onChange={(e) => setRememberMe(e.target.checked)}
							className="h-6 w-6 rounded accent-[rgb(var(--primary))]"
						/>
						Remember me on this device
					</label>

					{status === "error" && (
						<motion.div
							initial={{ opacity: 0, y: 5 }}
							animate={{ opacity: 1, y: 0 }}
							className="p-3 rounded-lg bg-danger-soft text-danger text-base"
							role="alert"
						>
							{errorMessage}
						</motion.div>
					)}

					<div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
						<Button variant="ghost" onClick={onClose}>
							Close
						</Button>
						<Button type="submit" size="lg" disabled={status === "submitting"}>
							{status === "submitting"
								? "Saving..."
								: isEditing
									? "Save Changes"
									: "Confirm RSVP"}
						</Button>
					</div>

					{isEditing && visitorId && (
						<div className="border-t border-border pt-4 text-center">
							<p className="text-sm text-ink-muted mb-2">
								Plans changed?
							</p>
							<ConfirmButton
								label="I can't make it"
								confirmLabel="Tap again to cancel my RSVP"
								onConfirm={handleCancel}
								className="text-base px-4 py-2.5"
							/>
						</div>
					)}
				</form>
			)}
		</Modal>
	);
}

/** Convex wraps thrown messages ("[CONVEX M(...)] Uncaught Error: ..."). */
function cleanConvexError(err: unknown): string {
	if (!(err instanceof Error) || !err.message) {
		return "Something went wrong. Please try again.";
	}
	const match = err.message.match(/Uncaught Error: (.*?)(?:\n|$)/);
	return match?.[1] ?? err.message;
}
