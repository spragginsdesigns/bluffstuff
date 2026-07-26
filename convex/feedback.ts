import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { isCommittee, requireCommittee } from "./committeeAuth";
import {
	MAX_COMMENT_LENGTH,
	MAX_NAME_LENGTH,
	NO_SHOW_REASON_KEYS
} from "./feedbackOptions";

/**
 * Post-event feedback. Submitting is public and anonymous by design — the
 * responses that matter most come from people who did NOT attend, and they
 * will not create an account to tell you why. Reading full responses is
 * committee-only.
 */

const MAX_VISITOR_ID_LENGTH = 64;

function cleanText(
	value: string | undefined,
	maxLength: number
): string | undefined {
	const trimmed = value?.trim();
	return trimmed ? trimmed.slice(0, maxLength) : undefined;
}

function cleanRating(value: number | undefined): number | undefined {
	if (typeof value !== "number" || !Number.isInteger(value)) {
		return undefined;
	}
	return value >= 1 && value <= 5 ? value : undefined;
}

function cleanReasons(values: string[] | undefined): string[] | undefined {
	if (!values?.length) {
		return undefined;
	}
	const known = Array.from(
		new Set(values.filter((r) => NO_SHOW_REASON_KEYS.includes(r)))
	);
	return known.length ? known : undefined;
}

export const submit = mutation({
	args: {
		eventId: v.id("events"),
		visitorId: v.string(),
		attended: v.boolean(),
		rating: v.optional(v.number()),
		reasons: v.optional(v.array(v.string())),
		comment: v.optional(v.string()),
		wants: v.optional(v.string()),
		name: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const visitorId = args.visitorId.trim().slice(0, MAX_VISITOR_ID_LENGTH);
		if (!visitorId) {
			throw new Error("Missing visitor id");
		}

		const event = await ctx.db.get(args.eventId);
		if (!event) {
			throw new Error("Event not found");
		}

		// Keep the record internally coherent no matter what the client sent:
		// a rating only means something for attendees, reasons only for no-shows.
		const fields = {
			attended: args.attended,
			rating: args.attended ? cleanRating(args.rating) : undefined,
			reasons: args.attended ? undefined : cleanReasons(args.reasons),
			comment: cleanText(args.comment, MAX_COMMENT_LENGTH),
			wants: cleanText(args.wants, MAX_COMMENT_LENGTH),
			name: cleanText(args.name, MAX_NAME_LENGTH)
		};

		// One response per browser per event — resubmitting amends it rather
		// than stacking duplicates.
		const existing = await ctx.db
			.query("eventFeedback")
			.withIndex("by_event_visitor", (q) =>
				q.eq("eventId", args.eventId).eq("visitorId", visitorId)
			)
			.first();

		if (existing) {
			await ctx.db.patch(existing._id, { ...fields, updatedAt: Date.now() });
			return existing._id;
		}

		return await ctx.db.insert("eventFeedback", {
			eventId: args.eventId,
			visitorId,
			...fields,
			createdAt: Date.now(),
			updatedAt: Date.now()
		});
	}
});

/** Lets the form show "you already told us" and prefill their own answer. */
export const getMine = query({
	args: { eventId: v.id("events"), visitorId: v.string() },
	handler: async (ctx, args) => {
		if (!args.visitorId) {
			return null;
		}
		return await ctx.db
			.query("eventFeedback")
			.withIndex("by_event_visitor", (q) =>
				q.eq("eventId", args.eventId).eq("visitorId", args.visitorId)
			)
			.first();
	}
});

/**
 * Public, deliberately count-only. Showing "12 neighbors have answered"
 * encourages responses without leaking anyone's comments.
 */
export const getCountByEvent = query({
	args: { eventId: v.id("events") },
	handler: async (ctx, args) => {
		const responses = await ctx.db
			.query("eventFeedback")
			.withIndex("by_event", (q) => q.eq("eventId", args.eventId))
			.collect();
		return responses.length;
	}
});

/** Committee-only: every response, including comments. */
export const listAll = query({
	args: {},
	handler: async (ctx) => {
		if (!(await isCommittee(ctx))) {
			return [];
		}
		return await ctx.db.query("eventFeedback").order("desc").collect();
	}
});

/** For clearing spam or a test submission — deleting real feedback throws
 *  away the only record of why someone stayed home, so use it sparingly. */
export const remove = mutation({
	args: { id: v.id("eventFeedback") },
	handler: async (ctx, args) => {
		await requireCommittee(ctx);
		return await ctx.db.delete(args.id);
	}
});
