"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import ConfirmButton from "./ui/ConfirmButton";

/**
 * Resident ideas ranked by votes — the committee's planning shortlist — plus
 * a hide switch for anything unsuitable. Ideas publish immediately, so this is
 * moderation after the fact rather than an approval queue.
 */
export default function CommitteeIdeasTab() {
	const ideas = useQuery(api.ideas.listForCommittee, {});
	const setHidden = useMutation(api.ideas.setHidden);
	const removeIdea = useMutation(api.ideas.remove);
	const [pendingId, setPendingId] = useState<Id<"eventIdeas"> | null>(null);

	const handleToggleHidden = async (
		ideaId: Id<"eventIdeas">,
		isHidden: boolean
	) => {
		setPendingId(ideaId);
		try {
			await setHidden({ ideaId, isHidden });
		} finally {
			setPendingId(null);
		}
	};

	return (
		<div>
			<h3 className="text-xl font-semibold text-ink mb-1">Resident Ideas</h3>
			<p className="text-ink-muted text-sm mb-6">
				Ranked by how many neighbors tapped them. Hidden ideas stay off the
				public board but keep their votes.
			</p>

			{ideas === undefined ? (
				<div className="flex justify-center py-8">
					<div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
				</div>
			) : ideas.length === 0 ? (
				<p className="text-ink-muted text-center py-8">No ideas yet.</p>
			) : (
				<div className="space-y-3">
					{ideas.map((idea) => (
						<div
							key={idea._id}
							className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
								idea.isHidden
									? "bg-surface-2 border-border opacity-60"
									: "bg-surface-2 border-border"
							}`}
						>
							<div className="flex-shrink-0 w-14 py-2 rounded-lg bg-primary-soft text-center">
								<div className="text-lg font-bold text-primary-strong leading-none">
									{idea.voteCount}
								</div>
								<div className="text-[11px] text-primary-strong/80 mt-1">
									votes
								</div>
							</div>

							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2 flex-wrap">
									<h4 className="text-ink font-medium">{idea.title}</h4>
									{idea.isHidden && (
										<span className="text-xs px-2 py-0.5 rounded-full bg-surface text-ink-muted border border-border">
											Hidden
										</span>
									)}
								</div>
								{idea.details && (
									<p className="text-ink-muted text-sm mt-1">{idea.details}</p>
								)}
								<p className="text-ink-faint text-xs mt-2">
									— {idea.submittedBy ?? "Anonymous"} ·{" "}
									{new Date(idea.createdAt).toLocaleDateString("en-US", {
										month: "short",
										day: "numeric",
										year: "numeric"
									})}
								</p>
							</div>

							<div className="flex-shrink-0 flex flex-col gap-2">
								<button
									onClick={() => handleToggleHidden(idea._id, !idea.isHidden)}
									disabled={pendingId === idea._id}
									className="px-3 py-1.5 rounded-lg text-sm text-ink-muted bg-surface hover:bg-surface-2 border border-border transition-colors disabled:opacity-60"
								>
									{idea.isHidden ? "Show" : "Hide"}
								</button>
								<ConfirmButton
									label="Delete"
									ariaLabel={`Delete idea: ${idea.title}`}
									onConfirm={() => removeIdea({ ideaId: idea._id })}
								/>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
