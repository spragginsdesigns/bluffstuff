"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useVisitorId } from "../hooks/useVisitorId";
import { friendlyError } from "../utils/friendlyError";

interface InterestButtonProps {
	eventId: Id<"events">;
}

/**
 * One tap, no form, no sign-in. RSVPs tell the committee who is committed;
 * this tells them whether anyone cares at all - early enough to move, rework,
 * or cancel an event before the supplies get bought.
 */
export default function InterestButton({ eventId }: InterestButtonProps) {
	const visitorId = useVisitorId();
	const status = useQuery(api.interest.statusByEvent, { eventId, visitorId });
	const toggle = useMutation(api.interest.toggle);
	const [isPending, setIsPending] = useState(false);
	const [error, setError] = useState("");

	const interested = status?.interested ?? false;
	const count = status?.count ?? 0;

	const handleClick = async () => {
		if (!visitorId || isPending) return;
		setIsPending(true);
		setError("");
		try {
			await toggle({ eventId, visitorId });
		} catch (err) {
			setError(
				friendlyError(
					err,
					"That didn't go through. Please check your connection and tap again."
				)
			);
		} finally {
			setIsPending(false);
		}
	};

	return (
		<div>
			<button
				type="button"
				onClick={handleClick}
				disabled={!visitorId || isPending}
				aria-pressed={interested}
				className={`w-full flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] rounded-xl border text-base font-medium transition-colors disabled:opacity-60 ${
					interested
						? "bg-accent-soft border-accent/40 text-accent-strong"
						: "bg-surface-2 border-border text-ink-muted hover:text-ink"
				}`}
			>
				<svg
					className="w-5 h-5 flex-shrink-0"
					fill={interested ? "currentColor" : "none"}
					viewBox="0 0 24 24"
					stroke="currentColor"
					aria-hidden="true"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={1.8}
						d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
					/>
				</svg>
				{interested ? "You're interested" : "Maybe - I'm interested"}
				{count > 0 && (
					<span
						className={`ml-1 rounded-full px-2 py-0.5 text-sm ${
							interested ? "bg-accent/20" : "bg-surface text-ink-muted"
						}`}
					>
						{count}
					</span>
				)}
			</button>
			{!interested && (
				<p className="mt-1.5 text-base text-ink-muted text-center">
					Not sure yet? Tap so we know to plan for you.
				</p>
			)}
			{error && (
				<p
					className="mt-2 p-3 rounded-lg bg-danger-soft text-danger text-base"
					role="alert"
				>
					{error}
				</p>
			)}
		</div>
	);
}
