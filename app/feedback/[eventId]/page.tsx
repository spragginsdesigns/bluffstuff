"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { NO_SHOW_REASONS } from "@/convex/feedbackOptions";
import { useVisitorId } from "../../hooks/useVisitorId";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import Field from "../../components/ui/Field";

/**
 * Public post-event feedback. No sign-in on purpose: the answers worth having
 * come from residents who did NOT attend, and they will not make an account to
 * tell you why. So the form opens with "did you make it?" and the *No* branch
 * is the substantial one.
 */

const RATING_SCALE = [1, 2, 3, 4, 5];

export default function EventFeedbackPage() {
	const params = useParams<{ eventId: string }>();
	const eventId = params?.eventId as Id<"events"> | undefined;
	const visitorId = useVisitorId();

	const event = useQuery(api.events.getById, eventId ? { id: eventId } : "skip");
	const existing = useQuery(
		api.feedback.getMine,
		eventId && visitorId ? { eventId, visitorId } : "skip"
	);
	const responseCount = useQuery(
		api.feedback.getCountByEvent,
		eventId ? { eventId } : "skip"
	);
	const submitFeedback = useMutation(api.feedback.submit);

	const [attended, setAttended] = useState<boolean | null>(null);
	const [rating, setRating] = useState<number | null>(null);
	const [reasons, setReasons] = useState<string[]>([]);
	const [comment, setComment] = useState("");
	const [wants, setWants] = useState("");
	const [name, setName] = useState("");
	const [status, setStatus] = useState<
		"idle" | "submitting" | "success" | "error"
	>("idle");

	// Prefill from a previous answer so returning here amends it instead of
	// looking like the response was lost.
	useEffect(() => {
		if (!existing) return;
		setAttended(existing.attended);
		setRating(existing.rating ?? null);
		setReasons(existing.reasons ?? []);
		setComment(existing.comment ?? "");
		setWants(existing.wants ?? "");
		setName(existing.name ?? "");
	}, [existing]);

	const toggleReason = (key: string) => {
		setReasons((prev) =>
			prev.includes(key) ? prev.filter((r) => r !== key) : [...prev, key]
		);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!eventId || !visitorId || attended === null) return;

		setStatus("submitting");
		try {
			await submitFeedback({
				eventId,
				visitorId,
				attended,
				rating: attended && rating ? rating : undefined,
				reasons: attended ? undefined : reasons,
				comment: comment.trim() || undefined,
				wants: wants.trim() || undefined,
				name: name.trim() || undefined
			});
			setStatus("success");
		} catch {
			setStatus("error");
		}
	};

	if (event === undefined) {
		return (
			<div className="min-h-screen flex items-center justify-center text-ink-muted">
				Loading…
			</div>
		);
	}

	if (event === null) {
		return (
			<div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
				<p className="text-ink-muted text-lg">
					We couldn&apos;t find that event.
				</p>
				<Link href="/" className="text-primary-strong underline">
					Back to the Bluffs
				</Link>
			</div>
		);
	}

	const eventDate = new Date(event.date + "T00:00:00").toLocaleDateString(
		"en-US",
		{ weekday: "long", month: "long", day: "numeric" }
	);

	if (status === "success") {
		return (
			<div className="min-h-screen flex items-center justify-center px-4 py-16">
				<motion.div
					initial={{ opacity: 0, scale: 0.96 }}
					animate={{ opacity: 1, scale: 1 }}
					className="bg-surface rounded-2xl border border-border shadow-card p-8 max-w-md w-full text-center"
				>
					<div className="w-16 h-16 mx-auto mb-5 rounded-full bg-accent-soft flex items-center justify-center">
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
					<h1 className="font-display text-2xl font-bold text-ink mb-2">
						Thank you!
					</h1>
					<p className="text-ink-muted text-base mb-6 leading-relaxed">
						This genuinely helps us plan better events. If you think of
						something else, come back any time — your answer will just get
						updated.
					</p>
					<div className="flex flex-col gap-3">
						<Link href="/#ideas">
							<Button className="w-full">Suggest an Event Idea</Button>
						</Link>
						<Link href="/">
							<Button variant="outline" className="w-full">
								Back to the Bluffs
							</Button>
						</Link>
					</div>
				</motion.div>
			</div>
		);
	}

	return (
		<div className="min-h-screen py-10 md:py-16">
			<div className="container mx-auto px-4 max-w-2xl">
				<div className="text-center mb-8">
					<p className="text-accent-strong font-medium text-sm uppercase tracking-wide mb-2">
						{eventDate}
					</p>
					<h1 className="font-display text-3xl md:text-4xl font-semibold text-ink">
						{event.title}
					</h1>
					<p className="mt-3 text-ink-muted text-base md:text-lg leading-relaxed">
						How did we do? Two quick questions — no sign-in, and you can leave
						your name off.
					</p>
					{responseCount !== undefined && responseCount > 0 && (
						<p className="mt-2 text-ink-faint text-sm">
							{responseCount === 1
								? "1 neighbor has answered so far"
								: `${responseCount} neighbors have answered so far`}
						</p>
					)}
				</div>

				<form
					onSubmit={handleSubmit}
					className="bg-surface rounded-2xl p-6 md:p-8 border border-border shadow-card space-y-7"
				>
					{existing && (
						<p className="text-sm text-ink-faint bg-surface-2 rounded-lg px-4 py-3">
							You answered this already — changing anything below will update
							your answer.
						</p>
					)}

					{/* The question the whole form exists for */}
					<fieldset>
						<legend className="block text-lg font-medium text-ink mb-3">
							Did you make it to this one?
						</legend>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<button
								type="button"
								onClick={() => setAttended(true)}
								aria-pressed={attended === true}
								className={`px-5 py-4 rounded-xl border text-base font-medium transition-colors ${
									attended === true
										? "bg-primary text-primary-fg border-primary"
										: "bg-surface-2 text-ink-muted border-border hover:text-ink"
								}`}
							>
								Yes, I was there
							</button>
							<button
								type="button"
								onClick={() => setAttended(false)}
								aria-pressed={attended === false}
								className={`px-5 py-4 rounded-xl border text-base font-medium transition-colors ${
									attended === false
										? "bg-primary text-primary-fg border-primary"
										: "bg-surface-2 text-ink-muted border-border hover:text-ink"
								}`}
							>
								No, I missed it
							</button>
						</div>
					</fieldset>

					{attended === true && (
						<motion.fieldset
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
						>
							<legend className="block text-lg font-medium text-ink mb-3">
								How was it?
							</legend>
							<div className="flex gap-2">
								{RATING_SCALE.map((value) => (
									<button
										key={value}
										type="button"
										onClick={() => setRating(value)}
										aria-label={`${value} out of 5`}
										aria-pressed={rating === value}
										className={`flex-1 py-4 rounded-xl border text-lg font-semibold transition-colors ${
											rating === value
												? "bg-accent text-accent-fg border-accent"
												: "bg-surface-2 text-ink-muted border-border hover:text-ink"
										}`}
									>
										{value}
									</button>
								))}
							</div>
							<div className="flex justify-between mt-2 text-sm text-ink-faint">
								<span>Not great</span>
								<span>Loved it</span>
							</div>
						</motion.fieldset>
					)}

					{attended === false && (
						<motion.fieldset
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
						>
							<legend className="block text-lg font-medium text-ink mb-1">
								What got in the way?
							</legend>
							<p className="text-ink-muted text-sm mb-3">
								Check anything that applies — this is the most useful thing you
								can tell us.
							</p>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
								{NO_SHOW_REASONS.map((reason) => {
									const checked = reasons.includes(reason.key);
									return (
										<label
											key={reason.key}
											className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${
												checked
													? "bg-primary-soft border-primary/40 text-ink"
													: "bg-surface-2 border-border text-ink-muted hover:text-ink"
											}`}
										>
											<input
												type="checkbox"
												checked={checked}
												onChange={() => toggleReason(reason.key)}
												className="w-5 h-5 flex-shrink-0 accent-current"
											/>
											<span className="text-base">{reason.label}</span>
										</label>
									);
								})}
							</div>
						</motion.fieldset>
					)}

					{attended !== null && (
						<motion.div
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							className="space-y-5"
						>
							<Field
								label={
									attended
										? "Anything you'd change? (optional)"
										: "Anything else you want us to know? (optional)"
								}
								htmlFor="comment"
							>
								<Textarea
									id="comment"
									rows={3}
									value={comment}
									onChange={(e) => setComment(e.target.value)}
									placeholder={
										attended
											? "What worked, what didn't…"
											: "Tell us in your own words…"
									}
								/>
							</Field>

							<Field
								label="What would you actually come to? (optional)"
								htmlFor="wants"
							>
								<Textarea
									id="wants"
									rows={3}
									value={wants}
									onChange={(e) => setWants(e.target.value)}
									placeholder="Bingo, potlucks, morning coffee, movie night…"
								/>
							</Field>

							<Field label="Your name (optional)" htmlFor="name">
								<Input
									id="name"
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="Leave blank to stay anonymous"
								/>
							</Field>
						</motion.div>
					)}

					{status === "error" && (
						<p className="p-3 rounded-xl bg-danger-soft text-danger text-sm">
							Something went wrong. Please try again.
						</p>
					)}

					<Button
						type="submit"
						size="lg"
						className="w-full"
						disabled={
							attended === null || !visitorId || status === "submitting"
						}
					>
						{status === "submitting"
							? "Sending…"
							: existing
								? "Update My Answer"
								: "Send Feedback"}
					</Button>

					{attended === null && (
						<p className="text-center text-ink-faint text-sm">
							Pick one above to get started.
						</p>
					)}
				</form>
			</div>
		</div>
	);
}
