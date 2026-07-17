"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useIsCommittee } from "../../hooks/useIsCommittee";
import Button, { buttonClasses } from "../../components/ui/Button";

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
			<div className="min-h-screen flex items-center justify-center text-ink-muted">
				Loading flyer…
			</div>
		);
	}

	if (event === null) {
		return (
			<div className="min-h-screen flex items-center justify-center text-ink-muted">
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
				<h1 className="font-display text-2xl md:text-3xl font-bold text-ink mb-2">
					{event.title} — Flyer
				</h1>
				<p className="text-ink-muted mb-5 max-w-md mx-auto">
					Print this flyer and post it around the park. The QR code takes
					residents to the website to see details and RSVP.
				</p>
				<div className="flex flex-wrap justify-center gap-3">
					<Button onClick={() => window.print()} size="lg">
						Print This Page
					</Button>
					<a
						href={flyerUrl}
						download={flyerFilename}
						className={buttonClasses("outline", "lg")}
					>
						Download
					</a>
					{isCommittee && (
						<Button
							variant="outline"
							size="lg"
							onClick={handleEmailFlyer}
							disabled={emailStatus === "sending" || emailStatus === "sent"}
						>
							{emailStatus === "sending"
								? "Sending…"
								: emailStatus === "sent"
									? "Emailed ✓"
									: "Email to the Printer"}
						</Button>
					)}
					{isCommittee && (
						<Button
							variant="outline"
							size="lg"
							onClick={handleGenerateArt}
							disabled={artStatus === "generating"}
						>
							{artStatus === "generating"
								? "Painting… (about a minute)"
								: event.imageUrl
									? "New Background Art"
									: "Generate Background Art"}
						</Button>
					)}
				</div>
				{emailStatus === "error" && (
					<p className="text-danger text-sm mt-3">
						The email didn&apos;t send — try again in a minute.
					</p>
				)}
				{artStatus === "error" && (
					<p className="text-danger text-sm mt-3">
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
