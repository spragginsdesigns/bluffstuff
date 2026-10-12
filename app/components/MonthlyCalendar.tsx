"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ConvexEvent } from "@/types/Event";
import {
	PARK_TIMEZONE,
	dayOfMonth,
	friendlyWhen,
	localDateIn,
	shortMonth
} from "../utils/parkDate";

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

const WEEKDAYS_LONG = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday"
];

const MONTH_ARROW_CLASSES =
	"inline-flex items-center justify-center min-h-[48px] min-w-[48px] rounded-xl border border-border bg-surface text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors";

export default function MonthlyCalendar({
	events,
	onEventClick
}: MonthlyCalendarProps) {
	// Park time, so the server render and the phone agree on "today" and on
	// which month opens first.
	const [todayYear, todayMonthNumber, todayDate] = localDateIn(PARK_TIMEZONE)
		.split("-")
		.map(Number);
	const todayMonth = todayMonthNumber - 1;
	const [currentMonth, setCurrentMonth] = useState(todayMonth);
	const [currentYear, setCurrentYear] = useState(todayYear);
	const [selectedDay, setSelectedDay] = useState<number | null>(null);
	const listRef = useRef<HTMLDivElement>(null);

	// The day's events render below the grid, often off-screen on a phone, so
	// bring them into view or the tap looks like it did nothing.
	useEffect(() => {
		if (selectedDay !== null) {
			listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
		}
	}, [selectedDay]);

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
		todayMonth === currentMonth && todayYear === currentYear ? todayDate : -1;

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
					className={MONTH_ARROW_CLASSES}
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
					className={MONTH_ARROW_CLASSES}
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
			{/* gap-0.5 on phones keeps each day close to a 44px tap target at 375px */}
			<div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-8">
				{/* Day headers */}
				{DAYS.map((day) => (
					<div
						key={day}
						aria-hidden="true"
						className="text-center text-sm md:text-base font-semibold text-ink-muted py-2"
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
					const eventCount = dayEvents?.length ?? 0;
					const weekday = WEEKDAYS_LONG[(firstDayOfMonth + i) % 7];
					const dayLabel = `${weekday}, ${MONTHS[currentMonth]} ${day}${
						isToday ? ", today" : ""
					}, ${
						eventCount === 0
							? "no events"
							: `${eventCount} ${eventCount === 1 ? "event" : "events"}`
					}`;

					return (
						<button
							key={day}
							type="button"
							disabled={eventCount === 0}
							aria-label={dayLabel}
							aria-pressed={eventCount > 0 ? isSelected : undefined}
							className={`aspect-square w-full rounded-lg flex flex-col items-center justify-center relative text-base transition-colors disabled:cursor-default ${
								isSelected
									? "ring-2 ring-primary bg-primary"
									: isToday
										? "ring-2 ring-primary bg-primary-soft"
										: dayEvents
											? "bg-primary-soft hover:bg-primary-soft/70"
											: "text-ink-muted"
							}`}
							onClick={() => setSelectedDay(isSelected ? null : day)}
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
						</button>
					);
				})}
			</div>

			{/* Events for this month. initial={false}: whatever is on screen at
			    first paint (including the server render) shows at full opacity;
			    only later month/day switches animate. */}
			<div ref={listRef} className="scroll-mt-24">
				<AnimatePresence mode="wait" initial={false}>
					{listEvents.length > 0 ? (
						<motion.div
							key={`${currentMonth}-${currentYear}-${selectedDay ?? "all"}`}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							className="space-y-3"
						>
							<div className="flex flex-wrap items-center justify-between gap-2 mb-4">
								<h4 className="text-lg font-semibold text-ink">{listTitle}</h4>
								{selectedDayEvents && (
									<button
										type="button"
										onClick={() => setSelectedDay(null)}
										className="inline-flex items-center min-h-[44px] px-2 text-base text-primary-strong underline underline-offset-2 font-medium transition-colors"
									>
										Show whole month
									</button>
								)}
							</div>
							{listEvents.map((event) => (
								<motion.button
									key={event._id}
									type="button"
									onClick={() => onEventClick(event)}
									whileHover={{ x: 4 }}
									className="w-full text-left p-4 rounded-xl bg-surface border border-border hover:border-primary/50 transition-all group"
								>
									<div className="flex items-center gap-4">
										<div className="flex-shrink-0 w-14 h-14 rounded-lg bg-primary-soft flex flex-col items-center justify-center">
											<span className="text-sm text-primary-strong font-semibold uppercase leading-none mb-0.5">
												{shortMonth(event.date)}
											</span>
											<span className="text-xl text-primary-strong font-bold leading-none">
												{dayOfMonth(event.date)}
											</span>
										</div>
										<div className="flex-1 min-w-0">
											<h5 className="text-lg text-ink font-semibold group-hover:text-primary transition-colors">
												{event.title}
											</h5>
											<p className="text-ink-muted text-base">
												{friendlyWhen(event.date, event.time)}
											</p>
											<p className="text-ink-muted text-base">
												{event.location}
											</p>
										</div>
										<svg
											className="w-5 h-5 text-ink-muted group-hover:text-primary transition-colors flex-shrink-0"
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
							))}
						</motion.div>
					) : (
						<motion.div
							key="no-events"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="text-center py-8 text-ink-muted"
						>
							<p className="text-lg">No events scheduled this month</p>
							<p className="text-base mt-1">
								Check other months or stay tuned!
							</p>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}
