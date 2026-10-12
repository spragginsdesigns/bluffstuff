import { mutation, query, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";
import { requireCommitteeSecret } from "./events";

/**
 * Backing data for the day-before reminder cron (`/api/sendReminders`).
 *
 * Secret-gated rather than JWT-gated: the caller is a scheduled job with no
 * browser session. `dueForReminder` returns attendee **email addresses**, so
 * it is the one query in this codebase that deliberately hands back PII —
 * hence the secret, and hence it must never be called from the browser.
 */

export const dueForReminder = query({
	args: { date: v.string(), secret: v.string() },
	handler: async (ctx, args) => {
		requireCommitteeSecret(args.secret);

		const events = await ctx.db
			.query("events")
			.withIndex("by_active", (q) => q.eq("isActive", true))
			.collect();

		const due = events.filter(
			(e) => e.date === args.date && e.reminderSentAt === undefined
		);

		return await Promise.all(due.map((event) => withRecipients(ctx, event)));
	}
});

/** An event plus the de-duplicated emails of everyone who RSVP'd to it. */
async function withRecipients(ctx: QueryCtx, event: Doc<"events">) {
	const rsvps = await ctx.db
		.query("rsvps")
		.withIndex("by_event", (q) => q.eq("eventId", event._id))
		.collect();

	// De-dupe by email - one person, one email, even if they managed to RSVP
	// twice under different names. Email is optional on an RSVP; residents
	// who left it blank get no email.
	const seen = new Set<string>();
	const recipients: { name: string; email: string }[] = [];
	for (const r of rsvps) {
		const email = r.email?.trim();
		const key = email?.toLowerCase();
		if (!email || !key || seen.has(key)) continue;
		seen.add(key);
		recipients.push({ name: r.name, email });
	}

	return {
		_id: event._id,
		title: event.title,
		date: event.date,
		time: event.time,
		location: event.location,
		recipients
	};
}

/**
 * Events that happened on `date` (yesterday, park time) and haven't had their
 * thank-you email yet. Same PII caveat and secret gate as dueForReminder.
 */
export const dueForThankYou = query({
	args: { date: v.string(), secret: v.string() },
	handler: async (ctx, args) => {
		requireCommitteeSecret(args.secret);

		const events = await ctx.db
			.query("events")
			.withIndex("by_active", (q) => q.eq("isActive", true))
			.collect();

		const due = events.filter(
			(e) => e.date === args.date && e.thankYouSentAt === undefined
		);

		return await Promise.all(due.map((event) => withRecipients(ctx, event)));
	}
});

/** Marks an event thanked. Same after-the-sends ordering as markReminded. */
export const markThanked = mutation({
	args: {
		eventId: v.id("events"),
		sentCount: v.number(),
		secret: v.string()
	},
	handler: async (ctx, args) => {
		requireCommitteeSecret(args.secret);
		return await ctx.db.patch(args.eventId, {
			thankYouSentAt: Date.now(),
			updatedAt: Date.now()
		});
	}
});

/**
 * Marks an event reminded. Called after the emails are sent, so a crash
 * mid-send retries the whole event next run rather than silently skipping it.
 */
export const markReminded = mutation({
	args: {
		eventId: v.id("events"),
		sentCount: v.number(),
		secret: v.string()
	},
	handler: async (ctx, args) => {
		requireCommitteeSecret(args.secret);
		return await ctx.db.patch(args.eventId, {
			reminderSentAt: Date.now(),
			updatedAt: Date.now()
		});
	}
});
