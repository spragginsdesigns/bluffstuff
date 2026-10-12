"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ConvexEvent } from "@/types/Event";
import RsvpModal from "./RsvpModal";
import AttendeesList from "./AttendeesList";
import InterestButton from "./InterestButton";
import Button from "./ui/Button";
import { useVisitorId } from "../hooks/useVisitorId";
import {
	generateGoogleCalendarLink,
	downloadICSFile
} from "../utils/calendar";
import { longWhen } from "../utils/parkDate";

interface EventActionsProps {
	event: ConvexEvent;
	/**
	 * Home-page cards: just RSVP and Pay. Everything else lives on the event
	 * page, so a card isn't a wall of nine buttons to choose from.
	 */
	compact?: boolean;
}

const PAY_FALLBACK_MESSAGE =
	"We couldn't open the payment page. Please try again, or pay at the door.";

export function formatEventPrice(priceCents: number | undefined): string | null {
	return priceCents && priceCents > 0
		? (priceCents / 100).toLocaleString("en-US", {
				style: "currency",
				currency: "usd"
			})
		: null;
}

// iPhones, iPads and Macs open a downloaded .ics straight into Apple Calendar.
// Everyone else (Android especially) is almost always on Google Calendar.
function isApplePlatform(): boolean {
	return /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);
}

function isCheckoutResponse(value: unknown): value is { url: string } {
	return (
		typeof value === "object" &&
		value !== null &&
		"url" in value &&
		typeof (value as { url: unknown }).url === "string"
	);
}

/**
 * Everything a resident can do with an upcoming event: RSVP (or change it),
 * see who's going, pay, tap interest, add it to their calendar, or share the
 * link. No account needed for any of it. Shared by the event cards on the
 * home page (compact) and the event's own page (/events/[eventId]).
 */
export default function EventActions({
	event,
	compact = false
}: EventActionsProps) {
	const [isRsvpOpen, setIsRsvpOpen] = useState(false);
	const [isAttendeesOpen, setIsAttendeesOpen] = useState(false);
	const [isPaying, setIsPaying] = useState(false);
	const [payError, setPayError] = useState("");
	const [shareNote, setShareNote] = useState("");

	const visitorId = useVisitorId();
	const myRsvp = useQuery(
		api.rsvps.myRsvp,
		visitorId ? { eventId: event._id, visitorId } : "skip"
	);
	const price = formatEventPrice(event.priceCents);

	// Residents get one plain sentence whatever went wrong: a server error, a
	// timeout, or an HTML error page that isn't JSON at all.
	const handlePay = async () => {
		setIsPaying(true);
		setPayError("");
		try {
			const res = await fetch("/api/checkout", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ eventId: event._id })
			});
			const data: unknown = res.ok ? await res.json() : null;
			if (isCheckoutResponse(data)) {
				window.location.href = data.url;
				return;
			}
		} catch {
			// Falls through to the friendly message below.
		}
		setIsPaying(false);
		setPayError(PAY_FALLBACK_MESSAGE);
	};

	// Phones get the native share sheet (Messages, WhatsApp, email…), which is
	// how residents actually pass things along. Anything else copies the link.
	// The text uses the full date, never "Today": it's read later, elsewhere.
	const handleShare = async () => {
		const url = `${window.location.origin}/events/${event._id}`;
		const text = `${event.title} - ${longWhen(event.date, event.time)}, ${event.location}`;
		if (typeof navigator.share === "function") {
			try {
				await navigator.share({ title: event.title, text, url });
			} catch {
				// Dismissing the share sheet throws; that's not an error.
			}
			return;
		}
		try {
			await navigator.clipboard.writeText(url);
			setShareNote("Link copied");
		} catch {
			setShareNote(url);
		}
	};

	const calendarEvent = {
		title: event.title,
		date: event.date,
		time: event.time,
		description: event.description,
		location: event.location
	};
	const openGoogleCalendar = () => {
		window.open(generateGoogleCalendarLink(calendarEvent), "_blank", "noopener");
	};
	const addToCalendar = () => {
		if (isApplePlatform()) downloadICSFile(calendarEvent);
		else openGoogleCalendar();
	};
	const addToOtherCalendar = () => {
		if (isApplePlatform()) openGoogleCalendar();
		else downloadICSFile(calendarEvent);
	};

	const rsvpButton = myRsvp ? (
		<button
			type="button"
			onClick={() => setIsRsvpOpen(true)}
			className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-accent bg-accent-soft px-4 py-3 min-h-[52px] text-lg font-semibold text-accent-strong"
		>
			<svg
				className="w-6 h-6 flex-shrink-0"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				aria-hidden="true"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2.5}
					d="M5 13l4 4L19 7"
				/>
			</svg>
			{myRsvp.partySize > 1
				? `You're going (${myRsvp.partySize})`
				: "You're going"}
			<span className="text-base font-normal underline underline-offset-2">
				Change
			</span>
		</button>
	) : (
		<Button size="lg" onClick={() => setIsRsvpOpen(true)} className="w-full">
			RSVP Now
		</Button>
	);

	const payButton = price && (
		<>
			<Button
				variant="secondary"
				onClick={handlePay}
				disabled={isPaying}
				className="w-full"
			>
				{isPaying ? "Opening secure checkout..." : `Pay Online - ${price}`}
			</Button>
			{payError && (
				<p className="p-3 rounded-lg bg-danger-soft text-danger text-base" role="alert">
					{payError}
				</p>
			)}
		</>
	);

	return (
		<>
			{compact ? (
				<div className="flex flex-col gap-3">
					{rsvpButton}
					{payButton}
				</div>
			) : (
				<div className="flex flex-col gap-3">
					{rsvpButton}
					<Button variant="outline" onClick={() => setIsAttendeesOpen(true)}>
						Who&apos;s Going?
					</Button>
					{payButton}
					<InterestButton eventId={event._id} />

					<div className="flex flex-col items-center">
						<Button variant="outline" onClick={addToCalendar} className="w-full">
							<svg
								className="w-5 h-5 text-primary flex-shrink-0"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
								/>
							</svg>
							Add to my calendar
						</Button>
						<button
							type="button"
							onClick={addToOtherCalendar}
							className="inline-flex items-center min-h-[44px] px-2 text-base text-ink-muted underline underline-offset-2 hover:text-ink"
						>
							Use a different calendar
						</button>
					</div>

					<Button variant="outline" onClick={handleShare}>
						<svg
							className="w-5 h-5 text-primary flex-shrink-0"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
							/>
						</svg>
						Share with a neighbor
					</Button>
					{shareNote && (
						<p className="text-base text-ink-muted text-center break-all" role="status">
							{shareNote}
						</p>
					)}
				</div>
			)}

			{isRsvpOpen && (
				<RsvpModal
					eventId={event._id}
					eventTitle={event.title}
					eventDate={event.date}
					eventTime={event.time}
					eventLocation={event.location}
					visitorId={visitorId}
					existing={myRsvp ?? null}
					onClose={() => setIsRsvpOpen(false)}
				/>
			)}
			{isAttendeesOpen && (
				<AttendeesList
					eventId={event._id}
					eventTitle={event.title}
					onClose={() => setIsAttendeesOpen(false)}
				/>
			)}
		</>
	);
}
