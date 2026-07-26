import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
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

		return await Promise.all(
			due.map(async (event) => {
				const rsvps = await ctx.db
					.query("rsvps")
					.withIndex("by_event", (q) => q.eq("eventId", event._id))
					.collect();

				// De-dupe by email — one person, one reminder, even if they
				// managed to RSVP twice under different names.
				const seen = new Set<string>();
				const recipients = rsvps
					.filter((r) => {
						const key = r.email.trim().toLowerCase();
						if (!key || seen.has(key)) return false;
						seen.add(key);
						return true;
					})
					.map((r) => ({ name: r.name, email: r.email.trim() }));

				return {
					_id: event._id,
					title: event.title,
					date: event.date,
					time: event.time,
					location: event.location,
					recipients
				};
			})
		);
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
