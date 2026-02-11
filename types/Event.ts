import { Id } from "../convex/_generated/dataModel";

// Convex-backed types (primary)
export interface ConvexEvent {
	_id: Id<"events">;
	_creationTime: number;
	title: string;
	description: string;
	date: string;
	time: string;
	location: string;
	imageUrl?: string;
	createdBy: string;
	isActive: boolean;
	createdAt: number;
	updatedAt: number;
}

export interface ConvexRsvp {
	_id: Id<"rsvps">;
	_creationTime: number;
	eventId: Id<"events">;
	name: string;
	email: string;
	phoneNumber?: string;
	notes?: string;
	createdAt: number;
}

// Keep legacy types for transition period
export interface Attendee {
	id: string;
	name: string;
	email?: string;
	phoneNumber?: string;
	notes?: string;
}

export interface Event {
	id: string;
	title: string;
	date: string;
	description: string;
	imageSrc: string;
	time?: string;
	location?: string;
	attendees: Attendee[];
}
