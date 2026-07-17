"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ConvexEvent } from "@/types/Event";
import EventFormModal from "./EventFormModal";
import { motion } from "framer-motion";
import Button from "./ui/Button";
import { COMMITTEE_MEMBERS } from "../data/committee";

type EventFilter = "active" | "all" | "archived";
const COLLAPSED_EVENT_COUNT = 5;

export default function CommitteeDashboard() {
	const allEvents = useQuery(api.events.listAll);
	// Identity flows through the Clerk JWT — no client-supplied email
	const contactMessages = useQuery(api.contactMessages.list, {});

	const [activeTab, setActiveTab] = useState<
		"events" | "messages" | "members"
	>("events");
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
		if (!allEvents) return { active: 0, all: 0, archived: 0 };
		return {
			active: allEvents.filter((e) => e.isActive).length,
			all: allEvents.length,
			archived: allEvents.filter((e) => !e.isActive).length
		};
	}, [allEvents]);

	const filteredEvents = useMemo(() => {
		if (!allEvents) return [];
		switch (eventFilter) {
			case "active":
				return allEvents.filter((e) => e.isActive);
			case "archived":
				return allEvents.filter((e) => !e.isActive);
			default:
				return allEvents;
		}
	}, [allEvents, eventFilter]);

	const needsCollapse = filteredEvents.length > COLLAPSED_EVENT_COUNT;
	const visibleEvents = showAllFilteredEvents
		? filteredEvents
		: filteredEvents.slice(0, COLLAPSED_EVENT_COUNT);

	const tabs = [
		{ id: "events" as const, label: "Manage Events" },
		{ id: "messages" as const, label: "Messages" },
		{ id: "members" as const, label: "Committee" }
	];

	const eventFilterTabs: { id: EventFilter; label: string; count: number }[] = [
		{ id: "active", label: "Active", count: filterCounts.active },
		{ id: "all", label: "All", count: filterCounts.all },
		{ id: "archived", label: "Archived", count: filterCounts.archived }
	];

	return (
		<section className="py-8 md:py-16">
			<div className="container mx-auto px-4 max-w-6xl">
				<h2 className="font-display text-2xl md:text-3xl font-semibold mb-8 text-ink">
					Committee Dashboard
				</h2>

				{/* Tabs - horizontal scroll on mobile */}
				<div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
					{tabs.map(({ id, label }) => (
						<motion.button
							key={id}
							whileTap={{ scale: 0.95 }}
							onClick={() => setActiveTab(id)}
							className={`px-5 py-2.5 rounded-full font-medium transition-colors duration-200 whitespace-nowrap text-sm md:text-base
                ${
									activeTab === id
										? "bg-primary text-primary-fg"
										: "bg-surface-2 text-ink-muted hover:text-ink"
								}`}
						>
							{label}
							{id === "messages" &&
								contactMessages &&
								contactMessages.length > 0 && (
									<span
										className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
											activeTab === id
												? "bg-primary-fg/20"
												: "bg-primary-soft text-primary-strong"
										}`}
									>
										{contactMessages.length}
									</span>
								)}
						</motion.button>
					))}
				</div>

				<div className="bg-surface rounded-xl p-4 md:p-6 border border-border shadow-card">
					{/* Manage Events Tab */}
					{activeTab === "events" && (
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

							{/* Event Filter Tabs */}
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

							{allEvents === undefined ? (
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
											const isPast =
												eventDate < new Date(new Date().toDateString());
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
																<h4 className="text-ink font-medium">
																	{event.title}
																</h4>
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

									{/* Gradient fade + toggle */}
									{needsCollapse && (
										<>
											{!showAllFilteredEvents && (
												<div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-surface to-transparent pointer-events-none rounded-b-xl" />
											)}
											<div className="flex justify-center mt-3">
												<button
													onClick={() =>
														setShowAllFilteredEvents(!showAllFilteredEvents)
													}
													className="px-4 py-2 rounded-lg text-xs font-medium text-ink-muted hover:text-ink bg-surface-2 hover:bg-surface-2/70 border border-border transition-colors duration-200"
												>
													{showAllFilteredEvents
														? "Collapse"
														: `Show all ${filteredEvents.length} events`}
												</button>
											</div>
										</>
									)}
								</div>
							)}
						</div>
					)}

					{/* Contact Messages Tab */}
					{activeTab === "messages" && (
						<div>
							<h3 className="text-xl font-semibold text-ink mb-6">
								Contact Messages
							</h3>
							{contactMessages === undefined ? (
								<div className="flex justify-center py-8">
									<div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
								</div>
							) : contactMessages.length === 0 ? (
								<p className="text-ink-muted text-center py-8">
									No messages yet.
								</p>
							) : (
								<div className="space-y-3">
									{contactMessages.map((msg) => (
										<div
											key={msg._id}
											className="p-4 rounded-xl bg-surface-2 border border-border"
										>
											<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
												<div>
													<span className="text-ink font-medium">
														{msg.name}
													</span>
													<span className="text-ink-faint text-sm ml-2">
														{msg.email}
													</span>
												</div>
												<span className="text-xs text-ink-faint">
													{new Date(msg.createdAt).toLocaleDateString("en-US", {
														month: "short",
														day: "numeric",
														year: "numeric"
													})}
												</span>
											</div>
											<div className="mb-1">
												<span className="text-sm text-primary-strong font-medium">
													{msg.subject}
												</span>
											</div>
											<p className="text-ink-muted text-sm">{msg.message}</p>
										</div>
									))}
								</div>
							)}
						</div>
					)}

					{/* Committee Members Tab */}
					{activeTab === "members" && (
						<div>
							<h3 className="text-xl font-semibold text-ink mb-6">
								Committee Members
							</h3>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								{COMMITTEE_MEMBERS.map((member, index) => (
									<motion.div
										key={member.name}
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: index * 0.1 }}
										className="p-4 rounded-xl bg-surface-2 border border-border"
									>
										<div className="flex items-center gap-3 mb-2">
											<div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-fg font-bold flex-shrink-0">
												{member.name.charAt(0)}
											</div>
											<div>
												<h4 className="text-ink font-medium">{member.name}</h4>
												<p className="text-primary-strong text-sm">
													{member.role}
												</p>
											</div>
										</div>
										<p className="text-ink-muted text-sm">
											{member.description}
										</p>
									</motion.div>
								))}
							</div>
						</div>
					)}
				</div>
			</div>

			{showEventForm && (
				<EventFormModal
					onClose={() => {
						setShowEventForm(false);
						setEditingEvent(null);
					}}
					editEvent={editingEvent}
				/>
			)}
		</section>
	);
}
