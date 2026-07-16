"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ConvexEvent } from "@/types/Event";
import EventFormModal from "./EventFormModal";
import { motion } from "framer-motion";

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
				<h2 className="text-2xl md:text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
					Committee Dashboard
				</h2>

				{/* Tabs - horizontal scroll on mobile */}
				<div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
					{tabs.map(({ id, label }) => (
						<motion.button
							key={id}
							whileTap={{ scale: 0.95 }}
							onClick={() => setActiveTab(id)}
							className={`px-5 py-2.5 rounded-full font-medium transition-all duration-200 whitespace-nowrap text-sm md:text-base
                ${
									activeTab === id
										? "bg-gradient-to-r from-purple-500 to-pink-600 text-white"
										: "bg-gray-800 text-gray-400 hover:bg-gray-700"
								}`}
						>
							{label}
							{id === "messages" &&
								contactMessages &&
								contactMessages.length > 0 && (
									<span className="ml-2 bg-white/20 rounded-full px-2 py-0.5 text-xs">
										{contactMessages.length}
									</span>
								)}
						</motion.button>
					))}
				</div>

				<div className="bg-gray-900/30 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-gray-700">
					{/* Manage Events Tab */}
					{activeTab === "events" && (
						<div>
							<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
								<h3 className="text-xl font-semibold text-white">
									All Events
								</h3>
								<button
									onClick={() => {
										setEditingEvent(null);
										setShowEventForm(true);
									}}
									className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-medium hover:from-purple-600 hover:to-pink-700 transition-colors text-sm"
								>
									+ Create Event
								</button>
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
										className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
											eventFilter === id
												? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
												: "text-gray-500 hover:text-gray-300 hover:bg-gray-800/50"
										}`}
									>
										{label}
										<span className="ml-1.5 opacity-70">{count}</span>
									</button>
								))}
							</div>

							{allEvents === undefined ? (
								<div className="flex justify-center py-8">
									<div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
								</div>
							) : filteredEvents.length === 0 ? (
								<p className="text-gray-400 text-center py-8">
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
															? "bg-gray-800/30 border-gray-700/50 opacity-60"
															: isPast
																? "bg-gray-800/50 border-yellow-600/30"
																: "bg-gray-800/50 border-gray-700"
													}`}
												>
													<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
														<div className="flex-1 min-w-0">
															<div className="flex items-center gap-2 flex-wrap">
																<h4 className="text-white font-medium">
																	{event.title}
																</h4>
																{!event.isActive && (
																	<span className="text-xs px-2 py-0.5 rounded-full bg-gray-600 text-gray-300">
																		Archived
																	</span>
																)}
																{isPast && event.isActive && (
																	<span className="text-xs px-2 py-0.5 rounded-full bg-yellow-600/20 text-yellow-400 border border-yellow-600/30">
																		Past
																	</span>
																)}
															</div>
															<p className="text-gray-400 text-sm mt-1">
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
																className="px-3 py-1.5 rounded-lg text-sm text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition-colors"
															>
																Flyer
															</a>
															<button
																onClick={() => {
																	setEditingEvent(event as ConvexEvent);
																	setShowEventForm(true);
																}}
																className="px-3 py-1.5 rounded-lg text-sm text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors"
															>
																Edit
															</button>
															{event.isActive && (
																<button
																	onClick={() => handleArchive(event._id)}
																	className="px-3 py-1.5 rounded-lg text-sm text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors"
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
												<div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-900/90 to-transparent pointer-events-none rounded-b-xl" />
											)}
											<div className="flex justify-center mt-3">
												<button
													onClick={() =>
														setShowAllFilteredEvents(!showAllFilteredEvents)
													}
													className="px-4 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-white bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700/50 transition-all duration-200"
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
							<h3 className="text-xl font-semibold text-white mb-6">
								Contact Messages
							</h3>
							{contactMessages === undefined ? (
								<div className="flex justify-center py-8">
									<div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
								</div>
							) : contactMessages.length === 0 ? (
								<p className="text-gray-400 text-center py-8">
									No messages yet.
								</p>
							) : (
								<div className="space-y-3">
									{contactMessages.map((msg) => (
										<div
											key={msg._id}
											className="p-4 rounded-xl bg-gray-800/50 border border-gray-700"
										>
											<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
												<div>
													<span className="text-white font-medium">
														{msg.name}
													</span>
													<span className="text-gray-500 text-sm ml-2">
														{msg.email}
													</span>
												</div>
												<span className="text-xs text-gray-500">
													{new Date(msg.createdAt).toLocaleDateString("en-US", {
														month: "short",
														day: "numeric",
														year: "numeric"
													})}
												</span>
											</div>
											<div className="mb-1">
												<span className="text-sm text-purple-400 font-medium">
													{msg.subject}
												</span>
											</div>
											<p className="text-gray-300 text-sm">{msg.message}</p>
										</div>
									))}
								</div>
							)}
						</div>
					)}

					{/* Committee Members Tab */}
					{activeTab === "members" && (
						<div>
							<h3 className="text-xl font-semibold text-white mb-6">
								Committee Members
							</h3>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								{[
									{
										name: "Kathy",
										role: "Committee Leader",
										description:
											"Leads the Activities Committee and organizes community events"
									},
									{
										name: "Austin Spraggins",
										role: "Treasurer",
										description:
											"Manages committee finances and event budgets"
									},
									{
										name: "Kim Anderson",
										role: "Committee Member",
										description:
											"Helps coordinate events and community outreach"
									},
									{
										name: "Donnalee",
										role: "Committee Member",
										description:
											"Assists with event planning and decorations"
									}
								].map((member, index) => (
									<motion.div
										key={member.name}
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: index * 0.1 }}
										className="p-4 rounded-xl bg-gray-800/50 border border-gray-700"
									>
										<div className="flex items-center gap-3 mb-2">
											<div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0">
												{member.name.charAt(0)}
											</div>
											<div>
												<h4 className="text-white font-medium">
													{member.name}
												</h4>
												<p className="text-purple-400 text-sm">{member.role}</p>
											</div>
										</div>
										<p className="text-gray-400 text-sm">
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
