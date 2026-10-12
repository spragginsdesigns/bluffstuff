import type { Metadata } from "next";
import Link from "next/link";
import { convexQuery } from "@/app/utils/convexServer";
import { SITE_NAME } from "@/app/config/site";
import { buttonClasses } from "@/app/components/ui/buttonStyles";
import { PARK_TIMEZONE, localDateIn } from "@/app/utils/parkDate";
import type { ConvexEvent } from "@/types/Event";
import EventDetail from "./EventDetail";

/**
 * One event, on its own page. This is where a flyer's QR code lands, and the
 * link residents text each other, so it must work signed out (public in
 * middleware.ts), read well on a phone, and never 500 on a bad or old link.
 */

// Always fresh: an edited time or location must show up immediately.
export const dynamic = "force-dynamic";

interface PageProps {
	params: { eventId: string };
}

async function loadEvent(eventId: string): Promise<ConvexEvent | null> {
	try {
		return await convexQuery<ConvexEvent | null>("events:getById", {
			id: eventId
		});
	} catch {
		// A malformed id fails Convex's argument validation - treat it like
		// any other link to an event that isn't there.
		return null;
	}
}

function longDate(date: string): string {
	return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
		weekday: "long",
		month: "long",
		day: "numeric"
	});
}

export async function generateMetadata({
	params
}: PageProps): Promise<Metadata> {
	const event = await loadEvent(params.eventId);
	if (!event || !event.isActive) {
		return { title: `Event not found - ${SITE_NAME}` };
	}

	const title = `${event.title} - ${longDate(event.date)}`;
	const description = `${longDate(event.date)} at ${event.time}, ${event.location}. RSVP in seconds, no account needed.`;
	// Texting the link previews the actual flyer
	const flyer = {
		url: `/api/flyer/${event._id}`,
		width: 1275,
		height: 1650,
		alt: `Flyer for ${event.title}`
	};

	return {
		title,
		description,
		openGraph: { title, description, images: [flyer], type: "website" },
		twitter: {
			card: "summary_large_image",
			title,
			description,
			images: [flyer.url]
		}
	};
}

export default async function EventPage({ params }: PageProps) {
	const event = await loadEvent(params.eventId);

	if (!event || !event.isActive) {
		return (
			<div className="max-w-xl mx-auto py-16 text-center">
				<h1 className="font-display text-3xl font-bold text-ink mb-3">
					This event isn&apos;t on the calendar anymore
				</h1>
				<p className="text-ink-muted text-lg mb-8">
					It may have been moved or cancelled. Here&apos;s everything coming
					up instead.
				</p>
				<Link href="/#events" className={buttonClasses("primary", "lg")}>
					See Upcoming Events
				</Link>
			</div>
		);
	}

	const isPast = event.date < localDateIn(PARK_TIMEZONE);

	return <EventDetail event={event} isPast={isPast} />;
}
