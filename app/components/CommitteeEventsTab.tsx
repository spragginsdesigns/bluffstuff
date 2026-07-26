"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Doc } from "@/convex/_generated/dataModel";
import { ConvexEvent } from "@/types/Event";
import EventFormModal from "./EventFormModal";
import Button from "./ui/Button";

interface CommitteeEventsTabProps {
	events: Doc<"events">[] | undefined;
}

type EventFilter = "active" | "all" | "archived";

const COLLAPSED_EVENT_COUNT = 5;

/** Create, edit, archive and print flyers for every event. */
export default function CommitteeEventsTab({
	events
}: CommitteeEventsTabProps) {
	const [showEventForm, setShowEventForm] = useState(false);
	const [editingEvent, setEditingEvent] = useState<ConvexEvent | null>(null);
	const [eventFilter, setEventFilter] = useState<EventFilter>("active");
	const [showAllFilteredEvents, setShowAllFilteredEvents] = useState(false);

	const handleArchive = async (eventId: ConvexEvent["_id"]) => {
		await fetch("/api/events", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ action: "archive", id: eventId })
		});
	};

	const filterCounts = useMemo(() => {
		if (!events) return { active: 0, all: 0, archived: 0 };
		return {
			active: events.filter((e) => e.isActive).length,
			all: events.length,
			archived: events.filter((e) => !e.isActive).length
		};
	}, [events]);

	const filteredEvents = useMemo(() => {
		if (!events) return [];
		switch (eventFilter) {
			case "active":
				return events.filter((e) => e.isActive);
			case "archived":
				return events.filter((e) => !e.isActive);
			default:
				return events;
		}
	}, [events, eventFilter]);

	const needsCollapse = filteredEvents.length > COLLAPSED_EVENT_COUNT;
	const visibleEvents = showAllFilteredEvents
		? filteredEvents
		: filteredEvents.slice(0, COLLAPSED_EVENT_COUNT);

	const eventFilterTabs: { id: EventFilter; label: string; count: number }[] = [
		{ id: "active", label: "Active", count: filterCounts.active },
		{ id: "all", label: "All", count: filterCounts.all },
		{ id: "archived", label: "Archived", count: filterCounts.archived }
	];

	return (
		<div>
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
				<h3 className="text-xl font-semibold text-ink">All Events</h3>
				<Button
					onClick={() => {
						setEditingEvent(null);
						setShowEventForm(true);
					}}
				>
					+ Create Event
				</Button>
			</div>

			<div className="flex gap-1.5 mb-4">
				{eventFilterTabs.map(({ id, label, count }) => (
					<button
						key={id}
						onClick={() => {
							setEventFilter(id);
							setShowAllFilteredEvents(false);
						}}
						className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200 ${
							eventFilter === id
								? "bg-primary-soft text-primary-strong"
								: "text-ink-faint hover:text-ink hover:bg-surface-2"
						}`}
					>
						{label}
						<span className="ml-1.5 opacity-70">{count}</span>
					</button>
				))}
			</div>

			{events === undefined ? (
				<div className="flex justify-center py-8">
					<div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
				</div>
			) : filteredEvents.length === 0 ? (
				<p className="text-ink-muted text-center py-8">
					{eventFilter === "active"
						? "No active events. Create your first event!"
						: eventFilter === "archived"
							? "No archived events."
							: "No events yet. Create your first event!"}
				</p>
			) : (
				<div className="relative">
					<div
						className={`space-y-3 ${
							needsCollapse && !showAllFilteredEvents
								? "max-h-[420px] overflow-hidden"
								: ""
						}`}
					>
						{visibleEvents.map((event) => {
							const eventDate = new Date(event.date + "T00:00:00");
							const isPast = eventDate < new Date(new Date().toDateString());
							return (
								<div
									key={event._id}
									className={`p-4 rounded-xl border transition-colors ${
										!event.isActive
											? "bg-surface-2 border-border opacity-60"
											: isPast
												? "bg-surface-2 border-primary/30"
												: "bg-surface-2 border-border"
									}`}
								>
									<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2 flex-wrap">
												<h4 className="text-ink font-medium">{event.title}</h4>
												{!event.isActive && (
													<span className="text-xs px-2 py-0.5 rounded-full bg-surface text-ink-muted border border-border">
														Archived
													</span>
												)}
												{isPast && event.isActive && (
													<span className="text-xs px-2 py-0.5 rounded-full bg-primary-soft text-primary-strong">
														Past
													</span>
												)}
											</div>
											<p className="text-ink-muted text-sm mt-1">
												{eventDate.toLocaleDateString("en-US", {
													weekday: "short",
													month: "long",
													day: "numeric",
													year: "numeric"
												})}{" "}
												at {event.time} &middot; {event.location}
											</p>
										</div>
										<div className="flex gap-2 flex-shrink-0">
											<a
												href={`/flyer/${event._id}`}
												target="_blank"
												rel="noopener noreferrer"
												className="px-3 py-1.5 rounded-lg text-sm text-primary-strong bg-primary-soft hover:bg-primary-soft/70 transition-colors"
											>
												Flyer
											</a>
											{isPast && (
												<a
													href={`/feedback/${event._id}`}
													target="_blank"
													rel="noopener noreferrer"
													className="px-3 py-1.5 rounded-lg text-sm text-ink-muted bg-surface hover:bg-surface-2 border border-border transition-colors"
												>
													Feedback
												</a>
											)}
											<button
												onClick={() => {
													setEditingEvent(event as ConvexEvent);
													setShowEventForm(true);
												}}
												className="px-3 py-1.5 rounded-lg text-sm text-ink-muted bg-surface hover:bg-surface-2 border border-border transition-colors"
											>
												Edit
											</button>
											{event.isActive && (
												<button
													onClick={() => handleArchive(event._id)}
													className="px-3 py-1.5 rounded-lg text-sm text-danger bg-danger-soft hover:bg-danger-soft/70 transition-colors"
												>
													Archive
												</button>
											)}
										</div>
									</div>
								</div>
							);
						})}
					</div>

					{needsCollapse && (
						<>
							{!showAllFilteredEvents && (
								<div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-surface to-transparent pointer-events-none rounded-b-xl" />
							)}
							<div className="flex justify-center mt-3">
								<motion.button
									whileTap={{ scale: 0.97 }}
									onClick={() =>
										setShowAllFilteredEvents(!showAllFilteredEvents)
									}
									className="px-4 py-2 rounded-lg text-xs font-medium text-ink-muted hover:text-ink bg-surface-2 hover:bg-surface-2/70 border border-border transition-colors duration-200"
								>
									{showAllFilteredEvents
										? "Collapse"
										: `Show all ${filteredEvents.length} events`}
								</motion.button>
							</div>
						</>
					)}
				</div>
			)}

			{showEventForm && (
				<EventFormModal
					onClose={() => {
						setShowEventForm(false);
						setEditingEvent(null);
					}}
					editEvent={editingEvent}
				/>
			)}
		</div>
	);
}
