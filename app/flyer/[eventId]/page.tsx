"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useIsCommittee } from "../../hooks/useIsCommittee";

/**
 * Shows the generated flyer PNG (same image that gets emailed to the
 * printer) with print/download/email actions. The PNG is the single
 * source of truth — what you see here is exactly what prints.
 */
export default function EventFlyerPage() {
	const params = useParams<{ eventId: string }>();
	const eventId = params?.eventId;
	const event = useQuery(
		api.events.getById,
		eventId ? { id: eventId as Id<"events"> } : "skip"
	);
	const { isCommittee } = useIsCommittee();
	const [emailStatus, setEmailStatus] = useState<
		"idle" | "sending" | "sent" | "error"
	>("idle");
	const [artStatus, setArtStatus] = useState<
		"idle" | "generating" | "error"
	>("idle");

	const handleGenerateArt = async () => {
		setArtStatus("generating");
		try {
			const res = await fetch("/api/generateFlyerArt", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ eventId })
			});
			// The Convex event updates in real time; the img src is keyed on
			// event.imageUrl so the flyer refreshes itself when art lands.
			setArtStatus(res.ok ? "idle" : "error");
		} catch {
			setArtStatus("error");
		}
	};

	const handleEmailFlyer = async () => {
		setEmailStatus("sending");
		try {
			const res = await fetch("/api/sendFlyer", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ eventId })
			});
			setEmailStatus(res.ok ? "sent" : "error");
		} catch {
			setEmailStatus("error");
		}
	};

	if (event === undefined) {
		return (
			<div className="min-h-screen flex items-center justify-center text-gray-400">
				Loading flyer…
			</div>
		);
	}

	if (event === null) {
		return (
			<div className="min-h-screen flex items-center justify-center text-gray-400">
				Event not found.
			</div>
		);
	}

	const flyerUrl = `/api/flyer/${eventId}`;
	const flyerFilename = `flyer-${event.title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "")}.png`;

	return (
		<div className="min-h-screen flex flex-col items-center py-10 print:py-0">
			{/* Screen-only helper bar */}
			<div className="print:hidden mb-8 text-center px-4">
				<h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
					{event.title} — Flyer
				</h1>
				<p className="text-gray-400 mb-5 max-w-md mx-auto">
					Print this flyer and post it around the park. The QR code takes
					residents to the website to see details and RSVP.
				</p>
				<div className="flex flex-wrap justify-center gap-3">
					<button
						onClick={() => window.print()}
						className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold hover:from-purple-600 hover:to-pink-700 transition-all duration-200"
					>
						Print This Page
					</button>
					<a
						href={flyerUrl}
						download={flyerFilename}
						className="px-8 py-3 rounded-xl bg-gray-700 text-white font-bold hover:bg-gray-600 transition-all duration-200"
					>
						Download
					</a>
					{isCommittee && (
						<button
							onClick={handleEmailFlyer}
							disabled={emailStatus === "sending" || emailStatus === "sent"}
							className="px-8 py-3 rounded-xl bg-gray-700 text-white font-bold hover:bg-gray-600 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
						>
							{emailStatus === "sending"
								? "Sending…"
								: emailStatus === "sent"
									? "Emailed ✓"
									: "Email to the Printer"}
						</button>
					)}
					{isCommittee && (
						<button
							onClick={handleGenerateArt}
							disabled={artStatus === "generating"}
							className="px-8 py-3 rounded-xl bg-gray-700 text-white font-bold hover:bg-gray-600 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
						>
							{artStatus === "generating"
								? "Painting… (about a minute)"
								: event.imageUrl
									? "New Background Art"
									: "Generate Background Art"}
						</button>
					)}
				</div>
				{emailStatus === "error" && (
					<p className="text-red-400 text-sm mt-3">
						The email didn&apos;t send — try again in a minute.
					</p>
				)}
				{artStatus === "error" && (
					<p className="text-red-400 text-sm mt-3">
						Art generation failed — try again in a minute.
					</p>
				)}
			</div>

			{/* The flyer PNG — exactly what prints and what gets emailed.
			    Keyed on imageUrl so it refreshes when background art lands. */}
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				key={event.imageUrl ?? "no-art"}
				src={`${flyerUrl}?v=${encodeURIComponent(event.imageUrl ?? "none")}`}
				alt={`${event.title} flyer — ${event.date} at ${event.time}, ${event.location}`}
				className="w-full max-w-2xl rounded-2xl shadow-2xl mx-4 print:max-w-full print:rounded-none print:shadow-none print:mx-0"
			/>
		</div>
	);
}
