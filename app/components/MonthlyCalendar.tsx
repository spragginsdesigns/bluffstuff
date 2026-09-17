"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ConvexEvent } from "@/types/Event";

interface MonthlyCalendarProps {
	events: ConvexEvent[];
	onEventClick: (event: ConvexEvent) => void;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December"
];

export default function MonthlyCalendar({
	events,
	onEventClick
}: MonthlyCalendarProps) {
	const today = new Date();
	const [currentMonth, setCurrentMonth] = useState(today.getMonth());
	const [currentYear, setCurrentYear] = useState(today.getFullYear());
	const [selectedDay, setSelectedDay] = useState<number | null>(null);

	const navigateMonth = (direction: -1 | 1) => {
		setSelectedDay(null);
		const newMonth = currentMonth + direction;
		if (newMonth < 0) {
			setCurrentMonth(11);
			setCurrentYear(currentYear - 1);
		} else if (newMonth > 11) {
			setCurrentMonth(0);
			setCurrentYear(currentYear + 1);
		} else {
			setCurrentMonth(newMonth);
		}
	};

	const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
	const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

	// Map events to day numbers for the current month
	const eventsByDay = useMemo(() => {
		const map = new Map<number, ConvexEvent[]>();
		events.forEach((event) => {
			const eventDate = new Date(event.date + "T00:00:00");
			if (
				eventDate.getMonth() === currentMonth &&
				eventDate.getFullYear() === currentYear
			) {
				const day = eventDate.getDate();
				if (!map.has(day)) map.set(day, []);
				map.get(day)!.push(event);
			}
		});
		return map;
	}, [events, currentMonth, currentYear]);

	// Events for this month sorted by date
	const monthEvents = useMemo(() => {
		return events
			.filter((event) => {
				const eventDate = new Date(event.date + "T00:00:00");
				return (
					eventDate.getMonth() === currentMonth &&
					eventDate.getFullYear() === currentYear
				);
			})
			.sort((a, b) => a.date.localeCompare(b.date));
	}, [events, currentMonth, currentYear]);

	const todayDay =
		today.getMonth() === currentMonth && today.getFullYear() === currentYear
			? today.getDate()
			: -1;

	// A tapped day filters the list below to just that day's events, so days
	// with multiple events don't hide all but the first one.
	const selectedDayEvents = selectedDay
		? (eventsByDay.get(selectedDay) ?? null)
		: null;
	const listEvents = selectedDayEvents ?? monthEvents;
	const listTitle = selectedDayEvents
		? `Events on ${MONTHS[currentMonth]} ${selectedDay}`
		: "Events This Month";

	return (
		<div>
			{/* Month navigation */}
			<div className="flex items-center justify-between mb-6">
				<button
					onClick={() => navigateMonth(-1)}
					className="p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors"
					aria-label="Previous month"
				>
					<svg
						className="w-6 h-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						aria-hidden="true"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M15 19l-7-7 7-7"
						/>
					</svg>
				</button>
				<h3 className="font-display text-xl md:text-2xl font-bold text-ink">
					{MONTHS[currentMonth]} {currentYear}
				</h3>
				<button
					onClick={() => navigateMonth(1)}
					className="p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors"
					aria-label="Next month"
				>
					<svg
						className="w-6 h-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						aria-hidden="true"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M9 5l7 7-7 7"
						/>
					</svg>
				</button>
			</div>

			{/* Calendar grid */}
			<div className="grid grid-cols-7 gap-1 mb-8">
				{/* Day headers */}
				{DAYS.map((day) => (
					<div
						key={day}
						className="text-center text-xs md:text-sm font-medium text-ink-muted py-2"
					>
						{day}
					</div>
				))}

				{/* Empty cells before first day */}
				{Array.from({ length: firstDayOfMonth }).map((_, i) => (
					<div key={`empty-${i}`} className="aspect-square" />
				))}

				{/* Day cells */}
				{Array.from({ length: daysInMonth }).map((_, i) => {
					const day = i + 1;
					const dayEvents = eventsByDay.get(day);
					const isToday = day === todayDay;
					const isSelected = day === selectedDay;

					return (
						<motion.div
							key={day}
							whileHover={dayEvents ? { scale: 1.05 } : {}}
							className={`aspect-square rounded-lg flex flex-col items-center justify-center relative text-sm md:text-base transition-colors ${
								isSelected
									? "ring-2 ring-primary bg-primary cursor-pointer"
									: isToday
										? "ring-2 ring-primary bg-primary-soft"
										: dayEvents
											? "bg-primary-soft cursor-pointer hover:bg-primary-soft/70"
											: "text-ink-faint"
							}`}
							onClick={() => {
								if (dayEvents && dayEvents.length > 0) {
									setSelectedDay(isSelected ? null : day);
								}
							}}
						>
							<span
								className={`${
									isSelected
										? "text-primary-fg font-bold"
										: isToday
											? "text-primary-strong font-bold"
											: dayEvents
												? "text-primary-strong font-medium"
												: ""
								}`}
							>
								{day}
							</span>
							{dayEvents && dayEvents.length > 0 && (
								<div className="flex gap-0.5 mt-0.5">
									{dayEvents.slice(0, 3).map((_, idx) => (
										<div
											key={idx}
											className={`w-1.5 h-1.5 rounded-full ${
												isSelected ? "bg-primary-fg" : "bg-primary"
											}`}
										/>
									))}
								</div>
							)}
						</motion.div>
					);
				})}
			</div>

			{/* Events for this month */}
			<AnimatePresence mode="wait">
				{listEvents.length > 0 ? (
					<motion.div
						key={`${currentMonth}-${currentYear}-${selectedDay ?? "all"}`}
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						className="space-y-3"
					>
						<div className="flex items-center justify-between mb-4">
							<h4 className="text-lg font-semibold text-ink">{listTitle}</h4>
							{selectedDayEvents && (
								<button
									onClick={() => setSelectedDay(null)}
									className="text-sm text-primary hover:text-primary-strong font-medium transition-colors"
								>
									Show whole month
								</button>
							)}
						</div>
						{listEvents.map((event) => {
							const eventDate = new Date(event.date + "T00:00:00");
							return (
								<motion.button
									key={event._id}
									onClick={() => onEventClick(event)}
									whileHover={{ x: 4 }}
									className="w-full text-left p-4 rounded-xl bg-surface border border-border hover:border-primary/50 transition-all group"
								>
									<div className="flex items-center gap-4">
										<div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary-soft flex flex-col items-center justify-center">
											<span className="text-xs text-primary-strong font-medium leading-none">
												{eventDate.toLocaleDateString("en-US", {
													month: "short"
												})}
											</span>
											<span className="text-lg text-primary-strong font-bold leading-none">
												{eventDate.getDate()}
											</span>
										</div>
										<div className="flex-1 min-w-0">
											<h5 className="text-ink font-medium group-hover:text-primary transition-colors truncate">
												{event.title}
											</h5>
											<p className="text-ink-muted text-sm">
												{event.time} &middot; {event.location}
											</p>
										</div>
										<svg
											className="w-5 h-5 text-ink-faint group-hover:text-primary transition-colors flex-shrink-0"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											aria-hidden="true"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M9 5l7 7-7 7"
											/>
										</svg>
									</div>
								</motion.button>
							);
						})}
					</motion.div>
				) : (
					<motion.div
						key="no-events"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="text-center py-8 text-ink-muted"
					>
						<p className="text-lg">No events scheduled this month</p>
						<p className="text-sm mt-1">Check other months or stay tuned!</p>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
