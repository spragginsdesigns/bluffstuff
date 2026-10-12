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

interface EventActionsProps {
	event: ConvexEvent;
}

const chipClasses =
	"flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-lg text-base text-ink-muted hover:text-ink bg-surface-2 hover:bg-surface-2/70 border border-border transition-colors";

export function formatEventPrice(priceCents: number | undefined): string | null {
	return priceCents && priceCents > 0
		? (priceCents / 100).toLocaleString("en-US", {
				style: "currency",
				currency: "usd"
			})
		: null;
}

/**
 * Everything a resident can do with an upcoming event: RSVP (or change it),
 * see who's going, pay, tap interest, add to a calendar, open the flyer, or
 * share the link. No account needed for any of it. Shared by the event cards
 * on the home page and the event's own page (/events/[eventId]).
 */
export default function EventActions({ event }: EventActionsProps) {
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

	const handlePay = async () => {
		setIsPaying(true);
		setPayError("");
		try {
			const res = await fetch("/api/checkout", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ eventId: event._id })
			});
			const data = await res.json();
			if (data.url) {
				window.location.href = data.url;
				return;
			}
			throw new Error(data.error ?? "Could not start the payment");
		} catch (err) {
			setIsPaying(false);
			setPayError(
				err instanceof Error && err.message
					? err.message
					: "Could not start the payment. Please try again, or pay cash at the door."
			);
		}
	};

	// Phones get the native share sheet (Messages, WhatsApp, email…), which is
	// how residents actually pass things along. Anything else copies the link.
	const handleShare = async () => {
		const url = `${window.location.origin}/events/${event._id}`;
		if (typeof navigator.share === "function") {
			try {
				await navigator.share({ title: event.title, url });
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

	return (
		<>
			<div className="flex flex-col gap-3">
				{myRsvp ? (
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
				)}
				<Button variant="outline" onClick={() => setIsAttendeesOpen(true)}>
					Who&apos;s Going?
				</Button>
				{price && (
					<Button variant="secondary" onClick={handlePay} disabled={isPaying}>
						{isPaying ? "Opening secure checkout..." : `Pay Online - ${price}`}
					</Button>
				)}
				{payError && (
					<p className="p-3 rounded-lg bg-danger-soft text-danger text-base">
						{payError}
					</p>
				)}
				<InterestButton eventId={event._id} />
			</div>

			<div className="flex flex-wrap gap-2 mt-3">
				<button
					type="button"
					onClick={() => {
						const link = generateGoogleCalendarLink(calendarEvent);
						window.open(link, "_blank", "noopener");
					}}
					className={chipClasses}
				>
					<svg className="w-4 h-4" viewBox="0 0 48 48" aria-hidden="true">
						<path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
						<path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
						<path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
						<path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
					</svg>
					Google
				</button>
				<button
					type="button"
					onClick={() => downloadICSFile(calendarEvent)}
					className={chipClasses}
				>
					<svg
						className="w-4 h-4"
						viewBox="0 0 16 16"
						fill="currentColor"
						aria-hidden="true"
					>
						<path d="M11.182.008C11.148-.03 9.923.023 8.857 1.18c-1.066 1.156-.902 2.482-.878 2.516s1.52.087 2.475-1.258.762-2.391.728-2.43m3.314 11.733c-.048-.096-2.325-1.234-2.113-3.422s1.675-2.789 1.698-2.854-.597-.79-1.254-1.157a3.7 3.7 0 0 0-1.563-.434c-.108-.003-.483-.095-1.254.116-.508.139-1.653.589-1.968.607-.316.018-1.256-.522-2.267-.665-.647-.125-1.333.131-1.824.328-.49.196-1.422.754-2.074 2.237-.652 1.482-.311 3.83-.067 4.56s.625 1.924 1.273 2.796c.576.984 1.34 1.667 1.659 1.899s1.219.386 1.843.067c.502-.308 1.408-.485 1.766-.472.357.013 1.061.154 1.782.539.571.197 1.111.115 1.652-.105.541-.221 1.324-1.059 2.238-2.758q.52-1.185.473-1.282"/>
					</svg>
					Apple / Outlook
				</button>
				<a
					href={`/flyer/${event._id}`}
					target="_blank"
					rel="noopener noreferrer"
					className={chipClasses}
				>
					<svg
						className="w-4 h-4 text-primary"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						aria-hidden="true"
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
				<button type="button" onClick={handleShare} className={chipClasses}>
					<svg
						className="w-4 h-4 text-primary"
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
					Share
				</button>
			</div>
			{shareNote && (
				<p className="mt-2 text-sm text-ink-muted break-all" role="status">
					{shareNote}
				</p>
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
