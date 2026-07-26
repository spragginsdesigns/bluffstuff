import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * One-tap interest on upcoming events. No form, no login — the whole point is
 * that it costs a resident one thumb tap, so the committee gets a demand
 * signal *before* buying supplies rather than a headcount afterwards.
 *
 * Deduped by an anonymous browser-local `visitorId`. That is honest about what
 * it measures: a soft signal, not a verified headcount. RSVPs remain the
 * authoritative list.
 */

const MAX_VISITOR_ID_LENGTH = 64;

export const toggle = mutation({
	args: { eventId: v.id("events"), visitorId: v.string() },
	handler: async (ctx, args) => {
		const visitorId = args.visitorId.trim().slice(0, MAX_VISITOR_ID_LENGTH);
		if (!visitorId) {
			throw new Error("Missing visitor id");
		}

		const event = await ctx.db.get(args.eventId);
		if (!event) {
			throw new Error("Event not found");
		}

		const existing = await ctx.db
			.query("eventInterest")
			.withIndex("by_event_visitor", (q) =>
				q.eq("eventId", args.eventId).eq("visitorId", visitorId)
			)
			.first();

		if (existing) {
			await ctx.db.delete(existing._id);
			return { interested: false };
		}

		await ctx.db.insert("eventInterest", {
			eventId: args.eventId,
			visitorId,
			createdAt: Date.now()
		});
		return { interested: true };
	}
});

export const statusByEvent = query({
	args: { eventId: v.id("events"), visitorId: v.optional(v.string()) },
	handler: async (ctx, args) => {
		const taps = await ctx.db
			.query("eventInterest")
			.withIndex("by_event", (q) => q.eq("eventId", args.eventId))
			.collect();

		return {
			count: taps.length,
			interested: args.visitorId
				? taps.some((t) => t.visitorId === args.visitorId)
				: false
		};
	}
});

/** Counts for every event at once — feeds the committee's turnout table. */
export const countsByEvent = query({
	args: {},
	handler: async (ctx) => {
		const taps = await ctx.db.query("eventInterest").collect();
		const counts: Record<string, number> = {};
		for (const tap of taps) {
			counts[tap.eventId] = (counts[tap.eventId] ?? 0) + 1;
		}
		return counts;
	}
});
