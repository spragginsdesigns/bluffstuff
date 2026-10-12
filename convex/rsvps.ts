import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";
import { isCommittee } from "./committeeAuth";

// RSVPs need no account. A resident gives a name and a headcount; email and
// phone are optional. `visitorId` (a random browser-local id) lets the same
// phone see, change or cancel its own RSVP - it is never returned to anyone
// else, so it can't be used to look up or cancel someone else's RSVP.

const MAX_PARTY_SIZE = 10;

/** Absent partySize on older rows means one person. */
function headcount(rsvp: Doc<"rsvps">): number {
	return rsvp.partySize ?? 1;
}

function clean(value: string | undefined): string | undefined {
	const trimmed = value?.trim();
	return trimmed ? trimmed : undefined;
}

export const getByEvent = query({
	args: { eventId: v.id("events") },
	handler: async (ctx, args) => {
		const rsvps = await ctx.db
			.query("rsvps")
			.withIndex("by_event", (q) => q.eq("eventId", args.eventId))
			.collect();

		// Public query - expose names and headcount only, never contact details
		return rsvps.map((r) => ({
			_id: r._id,
			name: r.name,
			partySize: headcount(r),
			createdAt: r.createdAt
		}));
	}
});

/** People coming (party sizes summed), not RSVP rows - it's what food is bought for. */
export const getCountByEvent = query({
	args: { eventId: v.id("events") },
	handler: async (ctx, args) => {
		const rsvps = await ctx.db
			.query("rsvps")
			.withIndex("by_event", (q) => q.eq("eventId", args.eventId))
			.collect();
		return rsvps.reduce((sum, r) => sum + headcount(r), 0);
	}
});

/** Headcount for every event at once - feeds the committee turnout table. */
export const countsByEvent = query({
	args: {},
	handler: async (ctx) => {
		const rsvps = await ctx.db.query("rsvps").collect();
		const counts: Record<string, number> = {};
		for (const rsvp of rsvps) {
			counts[rsvp.eventId] = (counts[rsvp.eventId] ?? 0) + headcount(rsvp);
		}
		return counts;
	}
});

/** This browser's own RSVP for an event, if any. */
export const myRsvp = query({
	args: { eventId: v.id("events"), visitorId: v.optional(v.string()) },
	handler: async (ctx, args) => {
		const visitorId = args.visitorId;
		if (!visitorId) return null;

		const rsvp = await ctx.db
			.query("rsvps")
			.withIndex("by_event_visitor", (q) =>
				q.eq("eventId", args.eventId).eq("visitorId", visitorId)
			)
			.first();
		if (!rsvp) return null;

		return {
			name: rsvp.name,
			partySize: headcount(rsvp),
			email: rsvp.email,
			phoneNumber: rsvp.phoneNumber,
			notes: rsvp.notes
		};
	}
});

/**
 * Create an RSVP, or amend this browser's existing one. Re-submitting from
 * the same phone changes the headcount instead of erroring.
 */
export const create = mutation({
	args: {
		eventId: v.id("events"),
		name: v.string(),
		email: v.optional(v.string()),
		phoneNumber: v.optional(v.string()),
		notes: v.optional(v.string()),
		partySize: v.optional(v.number()),
		visitorId: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const name = clean(args.name);
		if (!name) {
			throw new Error("Please enter your name");
		}

		const event = await ctx.db.get(args.eventId);
		if (!event || !event.isActive) {
			throw new Error("This event is no longer on the calendar");
		}

		const partySize = Math.min(
			MAX_PARTY_SIZE,
			Math.max(1, Math.round(args.partySize ?? 1))
		);
		const fields = {
			name,
			email: clean(args.email),
			phoneNumber: clean(args.phoneNumber),
			notes: clean(args.notes),
			partySize
		};

		const visitorId = clean(args.visitorId);
		if (visitorId) {
			const mine = await ctx.db
				.query("rsvps")
				.withIndex("by_event_visitor", (q) =>
					q.eq("eventId", args.eventId).eq("visitorId", visitorId)
				)
				.first();
			if (mine) {
				await ctx.db.patch(mine._id, fields);
				return mine._id;
			}
		}

		if (fields.email) {
			const email = fields.email.toLowerCase();
			const existing = await ctx.db
				.query("rsvps")
				.withIndex("by_event", (q) => q.eq("eventId", args.eventId))
				.collect();
			if (existing.some((r) => r.email?.trim().toLowerCase() === email)) {
				throw new Error("You're already on the list for this event");
			}
		}

		return await ctx.db.insert("rsvps", {
			eventId: args.eventId,
			...fields,
			visitorId,
			createdAt: Date.now()
		});
	}
});

/** "I can't make it" - removes this browser's own RSVP only. */
export const cancel = mutation({
	args: { eventId: v.id("events"), visitorId: v.string() },
	handler: async (ctx, args) => {
		const mine = await ctx.db
			.query("rsvps")
			.withIndex("by_event_visitor", (q) =>
				q.eq("eventId", args.eventId).eq("visitorId", args.visitorId)
			)
			.first();
		if (mine) {
			await ctx.db.delete(mine._id);
		}
		return mine !== null;
	}
});

/** Full guest list with contact details. Committee only (Clerk JWT). */
export const listForCommittee = query({
	args: { eventId: v.id("events") },
	handler: async (ctx, args) => {
		if (!(await isCommittee(ctx))) {
			return [];
		}

		const rsvps = await ctx.db
			.query("rsvps")
			.withIndex("by_event", (q) => q.eq("eventId", args.eventId))
			.collect();

		return rsvps
			.sort((a, b) => a.createdAt - b.createdAt)
			.map((r) => ({
				_id: r._id,
				name: r.name,
				partySize: headcount(r),
				email: r.email,
				phoneNumber: r.phoneNumber,
				notes: r.notes,
				createdAt: r.createdAt
			}));
	}
});
