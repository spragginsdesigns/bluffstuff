"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";

interface CommitteeOverviewProps {
	events: Doc<"events">[] | undefined;
	messageCount: number | undefined;
	onGoToFeedback: () => void;
}

function sumCounts(counts: Record<string, number> | undefined): number {
	return counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0;
}

/**
 * At-a-glance numbers plus the one nudge that matters: past events with no
 * headcount recorded. An unrecorded event is a permanently unanswerable
 * question later, so it gets surfaced rather than buried in a tab.
 */
export default function CommitteeOverview({
	events,
	messageCount,
	onGoToFeedback
}: CommitteeOverviewProps) {
	const feedback = useQuery(api.feedback.listAll, {});
	const ideas = useQuery(api.ideas.listForCommittee, {});
	const rsvpCounts = useQuery(api.rsvps.countsByEvent, {});
	const interestCounts = useQuery(api.interest.countsByEvent, {});

	const today = new Date().toLocaleDateString("en-CA");

	const { upcomingCount, missingHeadcount } = useMemo(() => {
		const list = events ?? [];
		return {
			upcomingCount: list.filter((e) => e.isActive && e.date >= today).length,
			missingHeadcount: list.filter(
				(e) => e.date < today && e.attendanceCount === undefined
			).length
		};
	}, [events, today]);

	const stats = [
		{ label: "Upcoming events", value: upcomingCount },
		{ label: "RSVPs", value: sumCounts(rsvpCounts) },
		{ label: "Interest taps", value: sumCounts(interestCounts) },
		{ label: "Feedback responses", value: feedback?.length },
		{ label: "Resident ideas", value: ideas?.length },
		{ label: "Messages", value: messageCount }
	];

	return (
		<div className="mb-6">
			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
				{stats.map(({ label, value }) => (
					<div
						key={label}
						className="p-4 rounded-xl bg-surface border border-border shadow-card"
					>
						<div className="font-display text-2xl font-bold text-ink leading-none">
							{value ?? "—"}
						</div>
						<div className="text-ink-faint text-xs mt-1.5 leading-snug">
							{label}
						</div>
					</div>
				))}
			</div>

			{missingHeadcount > 0 && (
				<button
					onClick={onGoToFeedback}
					className="mt-3 w-full flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-left p-4 rounded-xl bg-primary-soft border border-primary/20 hover:bg-primary-soft/70 transition-colors"
				>
					<span className="text-ink font-medium">
						{missingHeadcount === 1
							? "1 past event has no headcount recorded"
							: `${missingHeadcount} past events have no headcount recorded`}
					</span>
					<span className="text-ink-muted text-sm sm:ml-auto">
						Record it now &rarr;
					</span>
				</button>
			)}
		</div>
	);
}
