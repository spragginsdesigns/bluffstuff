"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { reasonLabel } from "@/convex/feedbackOptions";
import Button from "./ui/Button";
import Input from "./ui/Input";
import ConfirmButton from "./ui/ConfirmButton";

interface CommitteeFeedbackTabProps {
	events: Doc<"events">[];
}

const PAST_EVENT_LIMIT = 10;

/**
 * Turnout and feedback in one place.
 *
 * The headcount column is the point of this screen. Interest taps, RSVPs and
 * an actual headcount side by side turn "nobody came" into a diagnosable
 * number: low interest is a demand problem, high RSVPs with a low headcount is
 * a reminder or timing problem, and they need opposite fixes.
 */
export default function CommitteeFeedbackTab({
	events
}: CommitteeFeedbackTabProps) {
	const feedback = useQuery(api.feedback.listAll, {});
	const interestCounts = useQuery(api.interest.countsByEvent, {});
	const rsvpCounts = useQuery(api.rsvps.countsByEvent, {});
	const removeFeedback = useMutation(api.feedback.remove);

	const [editingId, setEditingId] = useState<Id<"events"> | null>(null);
	const [countDraft, setCountDraft] = useState("");
	const [noteDraft, setNoteDraft] = useState("");
	const [savingId, setSavingId] = useState<Id<"events"> | null>(null);
	const [saveError, setSaveError] = useState<string | null>(null);

	const today = new Date().toLocaleDateString("en-CA");

	const pastEvents = useMemo(
		() =>
			events
				.filter((e) => e.date < today)
				.sort((a, b) => b.date.localeCompare(a.date))
				.slice(0, PAST_EVENT_LIMIT),
		[events, today]
	);

	const feedbackByEvent = useMemo(() => {
		const grouped: Record<string, Doc<"eventFeedback">[]> = {};
		for (const response of feedback ?? []) {
			(grouped[response.eventId] ??= []).push(response);
		}
		return grouped;
	}, [feedback]);

	// Why people stayed home, across every event. The single most actionable
	// number on this page.
	const reasonTally = useMemo(() => {
		const tally: Record<string, number> = {};
		for (const response of feedback ?? []) {
			if (response.attended) continue;
			for (const key of response.reasons ?? []) {
				tally[key] = (tally[key] ?? 0) + 1;
			}
		}
		return Object.entries(tally).sort((a, b) => b[1] - a[1]);
	}, [feedback]);

	const totalNoShowResponses = (feedback ?? []).filter(
		(r) => !r.attended
	).length;

	const startEditing = (event: Doc<"events">) => {
		setEditingId(event._id);
		setCountDraft(
			event.attendanceCount === undefined ? "" : String(event.attendanceCount)
		);
		setNoteDraft(event.attendanceNote ?? "");
		setSaveError(null);
	};

	const handleSaveAttendance = async (eventId: Id<"events">) => {
		const count = Number(countDraft);
		if (!Number.isInteger(count) || count < 0) {
			setSaveError("Enter a whole number of people.");
			return;
		}

		setSavingId(eventId);
		setSaveError(null);
		try {
			const res = await fetch("/api/events", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "attendance",
					id: eventId,
					attendanceCount: count,
					attendanceNote: noteDraft.trim() || undefined
				})
			});
			if (!res.ok) {
				throw new Error("Save failed");
			}
			setEditingId(null);
		} catch {
			setSaveError("Couldn't save that — try again.");
		} finally {
			setSavingId(null);
		}
	};

	const eventTitle = (eventId: string) =>
		events.find((e) => e._id === eventId)?.title ?? "Unknown event";

	return (
		<div className="space-y-10">
			{/* Turnout */}
			<div>
				<h3 className="text-xl font-semibold text-ink mb-1">Turnout</h3>
				<p className="text-ink-muted text-sm mb-4">
					Record what actually happened. Without a headcount there&apos;s no way
					to tell a demand problem from a reminder problem.
				</p>

				{pastEvents.length === 0 ? (
					<p className="text-ink-muted text-center py-8">
						No past events yet.
					</p>
				) : (
					<div className="space-y-3">
						{pastEvents.map((event) => {
							const interested = interestCounts?.[event._id] ?? 0;
							const rsvps = rsvpCounts?.[event._id] ?? 0;
							const responses = feedbackByEvent[event._id]?.length ?? 0;
							const isEditing = editingId === event._id;

							return (
								<div
									key={event._id}
									className="p-4 rounded-xl bg-surface-2 border border-border"
								>
									<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
										<div className="min-w-0">
											<h4 className="text-ink font-medium">{event.title}</h4>
											<p className="text-ink-faint text-sm mt-0.5">
												{new Date(
													event.date + "T00:00:00"
												).toLocaleDateString("en-US", {
													weekday: "short",
													month: "long",
													day: "numeric"
												})}
											</p>
										</div>

										<div className="flex flex-wrap items-center gap-2 flex-shrink-0">
											<Stat label="interested" value={interested} />
											<Stat label="RSVP'd" value={rsvps} />
											<Stat
												label="showed up"
												value={event.attendanceCount}
												highlight
											/>
											<Stat label="responses" value={responses} />
										</div>
									</div>

									{isEditing ? (
										<div className="mt-4 space-y-3">
											<div className="flex flex-col sm:flex-row gap-2">
												<Input
													type="number"
													min={0}
													step={1}
													inputMode="numeric"
													value={countDraft}
													onChange={(e) => setCountDraft(e.target.value)}
													placeholder="How many showed up?"
													className="sm:max-w-[200px]"
													aria-label={`Headcount for ${event.title}`}
												/>
												<Input
													value={noteDraft}
													onChange={(e) => setNoteDraft(e.target.value)}
													placeholder="Anything odd? (rain, clashed with bingo…)"
													aria-label={`Note for ${event.title}`}
												/>
											</div>
											{saveError && (
												<p className="text-danger text-sm">{saveError}</p>
											)}
											<div className="flex gap-2">
												<Button
													onClick={() => handleSaveAttendance(event._id)}
													disabled={savingId === event._id}
												>
													{savingId === event._id ? "Saving…" : "Save"}
												</Button>
												<Button
													variant="outline"
													onClick={() => {
														setEditingId(null);
														setSaveError(null);
													}}
												>
													Cancel
												</Button>
											</div>
										</div>
									) : (
										<div className="mt-3 flex items-center gap-3 flex-wrap">
											<button
												onClick={() => startEditing(event)}
												className="px-3 py-1.5 rounded-lg text-sm text-primary-strong bg-primary-soft hover:bg-primary-soft/70 transition-colors"
											>
												{event.attendanceCount === undefined
													? "Record headcount"
													: "Edit headcount"}
											</button>
											{event.attendanceNote && (
												<span className="text-ink-faint text-sm">
													{event.attendanceNote}
												</span>
											)}
										</div>
									)}
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* Why people stayed home */}
			<div>
				<h3 className="text-xl font-semibold text-ink mb-1">
					Why People Didn&apos;t Come
				</h3>
				<p className="text-ink-muted text-sm mb-4">
					Across every event, from {totalNoShowResponses}{" "}
					{totalNoShowResponses === 1 ? "person who" : "people who"} said they
					missed one.
				</p>

				{reasonTally.length === 0 ? (
					<p className="text-ink-muted text-center py-8">
						No no-show feedback yet.
					</p>
				) : (
					<div className="space-y-2">
						{reasonTally.map(([key, count]) => {
							const share = Math.round((count / totalNoShowResponses) * 100);
							return (
								<div
									key={key}
									className="p-3 rounded-xl bg-surface-2 border border-border"
								>
									<div className="flex items-center justify-between gap-3 mb-1.5">
										<span className="text-ink text-sm font-medium">
											{reasonLabel(key)}
										</span>
										<span className="text-ink-faint text-sm flex-shrink-0">
											{count} ({share}%)
										</span>
									</div>
									<div className="h-2 rounded-full bg-surface overflow-hidden">
										<div
											className="h-full rounded-full bg-primary"
											style={{ width: `${share}%` }}
										/>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* Everything residents wrote */}
			<div>
				<h3 className="text-xl font-semibold text-ink mb-4">
					What People Said
				</h3>

				{feedback === undefined ? (
					<div className="flex justify-center py-8">
						<div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
					</div>
				) : feedback.length === 0 ? (
					<p className="text-ink-muted text-center py-8">No feedback yet.</p>
				) : (
					<div className="space-y-3">
						{feedback.map((response) => (
							<div
								key={response._id}
								className="p-4 rounded-xl bg-surface-2 border border-border"
							>
								<div className="flex flex-wrap items-center gap-2 mb-2">
									<span
										className={`text-xs px-2 py-0.5 rounded-full ${
											response.attended
												? "bg-accent-soft text-accent-strong"
												: "bg-danger-soft text-danger"
										}`}
									>
										{response.attended ? "Attended" : "Missed it"}
									</span>
									<span className="text-primary-strong text-sm font-medium">
										{eventTitle(response.eventId)}
									</span>
									{response.rating && (
										<span className="text-ink-faint text-sm">
											{response.rating}/5
										</span>
									)}
									<span className="text-ink-faint text-xs ml-auto">
										{new Date(response.createdAt).toLocaleDateString("en-US", {
											month: "short",
											day: "numeric"
										})}
									</span>
								</div>

								{response.reasons && response.reasons.length > 0 && (
									<div className="flex flex-wrap gap-1.5 mb-2">
										{response.reasons.map((key) => (
											<span
												key={key}
												className="text-xs px-2 py-0.5 rounded-full bg-surface text-ink-muted border border-border"
											>
												{reasonLabel(key)}
											</span>
										))}
									</div>
								)}

								{response.comment && (
									<p className="text-ink-muted text-sm">{response.comment}</p>
								)}
								{response.wants && (
									<p className="text-ink-muted text-sm mt-2">
										<span className="text-ink-faint">Wants: </span>
										{response.wants}
									</p>
								)}
								<div className="flex items-center justify-between gap-3 mt-2">
									<p className="text-ink-faint text-xs">
										— {response.name ?? "Anonymous"}
									</p>
									<ConfirmButton
										label="Delete"
										ariaLabel={`Delete feedback for ${eventTitle(response.eventId)}`}
										onConfirm={() => removeFeedback({ id: response._id })}
										className="flex-shrink-0"
									/>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

function Stat({
	label,
	value,
	highlight
}: {
	label: string;
	value: number | undefined;
	highlight?: boolean;
}) {
	return (
		<div
			className={`px-3 py-1.5 rounded-lg text-center ${
				highlight ? "bg-primary-soft" : "bg-surface"
			}`}
		>
			<div
				className={`text-base font-semibold leading-none ${
					highlight ? "text-primary-strong" : "text-ink"
				}`}
			>
				{value ?? "—"}
			</div>
			<div className="text-[11px] text-ink-faint mt-1">{label}</div>
		</div>
	);
}
