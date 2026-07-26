"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useVisitorId } from "../hooks/useVisitorId";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Textarea from "./ui/Textarea";
import Field from "./ui/Field";

/**
 * What do people actually want? One neighbor types "bingo night", everyone
 * else taps it. Voting is a single tap because typing is the real barrier for
 * a lot of the park — and a ranked list beats a pile of free-text suggestions
 * the committee has to read and tally by hand.
 */
export default function IdeaBoard() {
	const visitorId = useVisitorId();
	const ideas = useQuery(api.ideas.list, { visitorId });
	const submitIdea = useMutation(api.ideas.submit);
	const toggleVote = useMutation(api.ideas.toggleVote);

	const [title, setTitle] = useState("");
	const [details, setDetails] = useState("");
	const [name, setName] = useState("");
	const [status, setStatus] = useState<
		"idle" | "submitting" | "success" | "error"
	>("idle");
	const [pendingVoteId, setPendingVoteId] = useState<string | null>(null);

	const handleVote = async (ideaId: Id<"eventIdeas">) => {
		if (!visitorId || pendingVoteId) return;
		setPendingVoteId(ideaId);
		try {
			await toggleVote({ ideaId, visitorId });
		} finally {
			setPendingVoteId(null);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!visitorId || !title.trim()) return;

		setStatus("submitting");
		try {
			await submitIdea({
				title: title.trim(),
				details: details.trim() || undefined,
				submittedBy: name.trim() || undefined,
				visitorId
			});
			setTitle("");
			setDetails("");
			setStatus("success");
		} catch {
			setStatus("error");
		}
	};

	return (
		<section id="ideas" className="py-12 md:py-16 scroll-mt-20">
			<div className="container mx-auto px-4 max-w-3xl">
				<div className="text-center mb-8">
					<h2 className="font-display text-3xl md:text-4xl font-semibold text-ink">
						What Should We Do Next?
					</h2>
					<p className="text-ink-muted mt-3 text-base md:text-lg leading-relaxed">
						Tap the ideas you&apos;d actually show up for — or add your own. No
						sign-in needed.
					</p>
				</div>

				{ideas === undefined ? (
					<div className="flex justify-center py-10">
						<div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
					</div>
				) : ideas.length === 0 ? (
					<p className="text-ink-muted text-center py-8">
						No ideas yet — be the first to suggest something!
					</p>
				) : (
					<div className="space-y-3 mb-10">
						{ideas.map((idea, index) => (
							<motion.div
								key={idea._id}
								initial={{ opacity: 0, y: 10 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ delay: Math.min(index * 0.05, 0.3) }}
								className="flex items-start gap-4 p-4 rounded-2xl bg-surface border border-border shadow-card"
							>
								<button
									type="button"
									onClick={() => handleVote(idea._id)}
									disabled={!visitorId || pendingVoteId === idea._id}
									aria-pressed={idea.hasVoted}
									aria-label={
										idea.hasVoted
											? `Remove your vote for ${idea.title}`
											: `Vote for ${idea.title}`
									}
									className={`flex-shrink-0 flex flex-col items-center justify-center w-16 py-2.5 rounded-xl border transition-colors disabled:opacity-60 ${
										idea.hasVoted
											? "bg-primary text-primary-fg border-primary"
											: "bg-surface-2 text-ink-muted border-border hover:text-ink"
									}`}
								>
									<svg
										className="w-5 h-5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										aria-hidden="true"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2.2}
											d="M5 15l7-7 7 7"
										/>
									</svg>
									<span className="text-lg font-bold leading-tight">
										{idea.voteCount}
									</span>
								</button>

								<div className="flex-1 min-w-0 pt-1">
									<h3 className="text-ink font-semibold text-lg leading-snug">
										{idea.title}
									</h3>
									{idea.details && (
										<p className="text-ink-muted text-base mt-1 leading-relaxed">
											{idea.details}
										</p>
									)}
									{idea.submittedBy && (
										<p className="text-ink-faint text-sm mt-2">
											suggested by {idea.submittedBy}
										</p>
									)}
								</div>
							</motion.div>
						))}
					</div>
				)}

				<div className="bg-surface-2/60 rounded-2xl p-6 md:p-7 border border-border">
					<h3 className="font-display text-xl font-bold text-ink mb-1">
						Have an idea?
					</h3>
					<p className="text-ink-muted text-base mb-5">
						Anything you&apos;d like to see at the Bluffs — big or small.
					</p>

					{status === "success" ? (
						<div className="text-center py-4">
							<p className="text-accent-strong font-medium text-lg mb-4">
								Added — thank you!
							</p>
							<Button variant="outline" onClick={() => setStatus("idle")}>
								Suggest Another
							</Button>
						</div>
					) : (
						<form onSubmit={handleSubmit} className="space-y-4">
							<Field label="Your idea" htmlFor="idea-title" required>
								<Input
									id="idea-title"
									required
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									placeholder="Bingo night, morning coffee, movie night…"
								/>
							</Field>

							<Field label="A bit more (optional)" htmlFor="idea-details">
								<Textarea
									id="idea-details"
									rows={2}
									value={details}
									onChange={(e) => setDetails(e.target.value)}
									placeholder="When would it work? Who's it for?"
								/>
							</Field>

							<Field label="Your name (optional)" htmlFor="idea-name">
								<Input
									id="idea-name"
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="Leave blank to stay anonymous"
								/>
							</Field>

							{status === "error" && (
								<p className="p-3 rounded-xl bg-danger-soft text-danger text-sm">
									Something went wrong. Please try again.
								</p>
							)}

							<Button
								type="submit"
								className="w-full"
								disabled={
									!visitorId || !title.trim() || status === "submitting"
								}
							>
								{status === "submitting" ? "Adding…" : "Add My Idea"}
							</Button>
						</form>
					)}
				</div>
			</div>
		</section>
	);
}
