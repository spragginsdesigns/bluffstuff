import type { Metadata } from "next";
import { convexQuery } from "@/app/utils/convexServer";
import { SITE_NAME } from "@/app/config/site";
import EventGone from "@/app/components/EventGone";
import { PARK_TIMEZONE, localDateIn, longDay, longWhen } from "@/app/utils/parkDate";
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

export async function generateMetadata({
	params
}: PageProps): Promise<Metadata> {
	const event = await loadEvent(params.eventId);
	if (!event || !event.isActive) {
		return { title: `Event not found - ${SITE_NAME}` };
	}

	// Full dates, never "Today"/"Tomorrow": link previews are cached and read
	// days after they were generated.
	const title = `${event.title} - ${longDay(event.date)}`;
	const description = `${longWhen(event.date, event.time)}, ${event.location}. RSVP in seconds, no account needed.`;
	// Texting the link previews the actual flyer. The version makes Facebook
	// and Messages fetch a fresh image after an edit instead of their cached one.
	const flyer = {
		url: `/api/flyer/${event._id}?v=${event.updatedAt}`,
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
		return <EventGone />;
	}

	const isPast = event.date < localDateIn(PARK_TIMEZONE);

	return <EventDetail event={event} isPast={isPast} />;
}
