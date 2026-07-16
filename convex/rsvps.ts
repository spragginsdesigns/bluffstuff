import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getByEvent = query({
	args: { eventId: v.id("events") },
	handler: async (ctx, args) => {
		const rsvps = await ctx.db
			.query("rsvps")
			.withIndex("by_event", (q) => q.eq("eventId", args.eventId))
			.collect();

		// Public query — expose names only, never emails/phones/notes
		return rsvps.map((r) => ({
			_id: r._id,
			name: r.name,
			createdAt: r.createdAt
		}));
	}
});

export const getCountByEvent = query({
	args: { eventId: v.id("events") },
	handler: async (ctx, args) => {
		const rsvps = await ctx.db
			.query("rsvps")
			.withIndex("by_event", (q) => q.eq("eventId", args.eventId))
			.collect();
		return rsvps.length;
	}
});

export const create = mutation({
	args: {
		eventId: v.id("events"),
		name: v.string(),
		email: v.string(),
		phoneNumber: v.optional(v.string()),
		notes: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		// Check for duplicate RSVP
		const existing = await ctx.db
			.query("rsvps")
			.withIndex("by_event", (q) => q.eq("eventId", args.eventId))
			.collect();

		const alreadyRsvpd = existing.find((r) => r.email === args.email);
		if (alreadyRsvpd) {
			throw new Error("You have already RSVP'd to this event");
		}

		return await ctx.db.insert("rsvps", {
			...args,
			createdAt: Date.now()
		});
	}
});

