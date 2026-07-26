import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Committee write mutations are gated by a shared secret (set with
// `npx convex env set COMMITTEE_API_SECRET ...` per deployment). Clients
// never hold it — the website's writes go through Clerk-authenticated
// Next.js API routes, and trusted agents call Convex with it directly.
// The email args remain for attribution but are not the auth boundary.
export function requireCommitteeSecret(secret: string): void {
	const expected = process.env.COMMITTEE_API_SECRET;
	if (!expected || secret !== expected) {
		throw new Error("Invalid committee secret");
	}
}

export const listUpcoming = query({
	args: { localDate: v.optional(v.string()) },
	handler: async (ctx, args) => {
		// Use the client's local date if provided, otherwise fall back to UTC
		const today = args.localDate ?? new Date().toISOString().split("T")[0];
		const events = await ctx.db
			.query("events")
			.withIndex("by_active", (q) => q.eq("isActive", true))
			.collect();

		// Filter to events whose date is today or in the future
		return events
			.filter((e) => e.date >= today)
			.sort((a, b) => a.date.localeCompare(b.date));
	}
});

// Nobody remembers an event well enough to review it months later, and a
// stale "how did we do?" list reads as neglect. Only ask about recent ones.
const FEEDBACK_WINDOW_DAYS = 30;

/**
 * Recently finished events — the ones worth asking residents about.
 *
 * Active only, so archiving still removes an event from the site as documented.
 * Archived events keep their feedback page; it's reached through the flyer URL,
 * which also survives archiving.
 */
export const listRecentPast = query({
	args: { localDate: v.optional(v.string()), limit: v.optional(v.number()) },
	handler: async (ctx, args) => {
		const today = args.localDate ?? new Date().toISOString().split("T")[0];
		const cutoff = new Date(today + "T00:00:00");
		cutoff.setDate(cutoff.getDate() - FEEDBACK_WINDOW_DAYS);
		const cutoffDate = cutoff.toISOString().split("T")[0];

		const events = await ctx.db
			.query("events")
			.withIndex("by_active", (q) => q.eq("isActive", true))
			.collect();

		return events
			.filter((e) => e.date < today && e.date >= cutoffDate)
			.sort((a, b) => b.date.localeCompare(a.date))
			.slice(0, args.limit ?? 3);
	}
});

export const listAll = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db
			.query("events")
			.order("desc")
			.collect();
	}
});

export const getById = query({
	args: { id: v.id("events") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id);
	}
});

export const create = mutation({
	args: {
		title: v.string(),
		description: v.string(),
		date: v.string(),
		time: v.string(),
		location: v.string(),
		imageUrl: v.optional(v.string()),
		priceCents: v.optional(v.number()),
		createdBy: v.string(),
		secret: v.string()
	},
	handler: async (ctx, args) => {
		requireCommitteeSecret(args.secret);

		// Attribution must still point at a real committee member
		const user = await ctx.db
			.query("users")
			.filter((q) => q.eq(q.field("email"), args.createdBy))
			.first();

		if (!user || user.role !== "committee") {
			throw new Error("Only committee members can create events");
		}

		const { secret, ...eventFields } = args;
		return await ctx.db.insert("events", {
			...eventFields,
			isActive: true,
			createdAt: Date.now(),
			updatedAt: Date.now()
		});
	}
});

export const update = mutation({
	args: {
		id: v.id("events"),
		title: v.optional(v.string()),
		description: v.optional(v.string()),
		date: v.optional(v.string()),
		time: v.optional(v.string()),
		location: v.optional(v.string()),
		imageUrl: v.optional(v.string()),
		priceCents: v.optional(v.number()),
		updaterEmail: v.string(),
		secret: v.string()
	},
	handler: async (ctx, args) => {
		requireCommitteeSecret(args.secret);

		const user = await ctx.db
			.query("users")
			.filter((q) => q.eq(q.field("email"), args.updaterEmail))
			.first();

		if (!user || user.role !== "committee") {
			throw new Error("Only committee members can update events");
		}

		const { id, updaterEmail, secret, ...updates } = args;
		const cleanUpdates: Record<string, unknown> = { updatedAt: Date.now() };
		for (const [key, value] of Object.entries(updates)) {
			if (value !== undefined) {
				cleanUpdates[key] = value;
			}
		}

		return await ctx.db.patch(id, cleanUpdates);
	}
});

/**
 * Records what actually happened at an event. Without this number an empty
 * feedback inbox is unreadable: "nobody was interested" and "everyone said
 * yes then stayed home" look identical, and they need opposite fixes.
 */
export const setAttendance = mutation({
	args: {
		id: v.id("events"),
		attendanceCount: v.number(),
		attendanceNote: v.optional(v.string()),
		updaterEmail: v.string(),
		secret: v.string()
	},
	handler: async (ctx, args) => {
		requireCommitteeSecret(args.secret);

		const user = await ctx.db
			.query("users")
			.filter((q) => q.eq(q.field("email"), args.updaterEmail))
			.first();

		if (!user || user.role !== "committee") {
			throw new Error("Only committee members can record attendance");
		}

		if (!Number.isInteger(args.attendanceCount) || args.attendanceCount < 0) {
			throw new Error("Attendance must be a whole number of people");
		}

		return await ctx.db.patch(args.id, {
			attendanceCount: args.attendanceCount,
			attendanceNote: args.attendanceNote?.trim() || undefined,
			updatedAt: Date.now()
		});
	}
});

/**
 * Permanently deletes an event and everything scoped to it — RSVPs, feedback
 * and interest taps. Archiving is the normal way to retire an event; this
 * exists for clearing test rows that would otherwise clutter the dashboard
 * forever.
 *
 * Refuses when the event has payment records attached: those are the receipt
 * trail for money that actually changed hands, and no cleanup convenience is
 * worth deleting them. Archive that event instead.
 */
export const remove = mutation({
	args: {
		id: v.id("events"),
		deleterEmail: v.string(),
		secret: v.string()
	},
	handler: async (ctx, args) => {
		requireCommitteeSecret(args.secret);

		const user = await ctx.db
			.query("users")
			.filter((q) => q.eq(q.field("email"), args.deleterEmail))
			.first();

		if (!user || user.role !== "committee") {
			throw new Error("Only committee members can delete events");
		}

		const event = await ctx.db.get(args.id);
		if (!event) {
			throw new Error("Event not found");
		}

		const payments = await ctx.db
			.query("payments")
			.withIndex("by_event", (q) => q.eq("eventId", args.id))
			.collect();
		if (payments.length > 0) {
			throw new Error(
				`Refusing to delete "${event.title}": it has ${payments.length} payment record(s). Archive it instead.`
			);
		}

		const rsvps = await ctx.db
			.query("rsvps")
			.withIndex("by_event", (q) => q.eq("eventId", args.id))
			.collect();
		const feedback = await ctx.db
			.query("eventFeedback")
			.withIndex("by_event", (q) => q.eq("eventId", args.id))
			.collect();
		const interest = await ctx.db
			.query("eventInterest")
			.withIndex("by_event", (q) => q.eq("eventId", args.id))
			.collect();

		for (const row of [...rsvps, ...feedback, ...interest]) {
			await ctx.db.delete(row._id);
		}
		await ctx.db.delete(args.id);

		return {
			title: event.title,
			deleted: {
				rsvps: rsvps.length,
				feedback: feedback.length,
				interest: interest.length
			}
		};
	}
});

export const generateUploadUrl = mutation({
	args: { requesterEmail: v.string(), secret: v.string() },
	handler: async (ctx, args) => {
		requireCommitteeSecret(args.secret);

		const user = await ctx.db
			.query("users")
			.filter((q) => q.eq(q.field("email"), args.requesterEmail))
			.first();

		if (!user || user.role !== "committee") {
			throw new Error("Only committee members can upload files");
		}

		return await ctx.storage.generateUploadUrl();
	}
});

export const setEventImage = mutation({
	args: {
		id: v.id("events"),
		storageId: v.id("_storage"),
		updaterEmail: v.string(),
		secret: v.string()
	},
	handler: async (ctx, args) => {
		requireCommitteeSecret(args.secret);

		const user = await ctx.db
			.query("users")
			.filter((q) => q.eq(q.field("email"), args.updaterEmail))
			.first();

		if (!user || user.role !== "committee") {
			throw new Error("Only committee members can update events");
		}

		const imageUrl = await ctx.storage.getUrl(args.storageId);
		if (!imageUrl) {
			throw new Error("Uploaded file not found in storage");
		}

		return await ctx.db.patch(args.id, {
			imageUrl,
			updatedAt: Date.now()
		});
	}
});

export const archive = mutation({
	args: {
		id: v.id("events"),
		archiverEmail: v.string(),
		secret: v.string()
	},
	handler: async (ctx, args) => {
		requireCommitteeSecret(args.secret);

		const user = await ctx.db
			.query("users")
			.filter((q) => q.eq(q.field("email"), args.archiverEmail))
			.first();

		if (!user || user.role !== "committee") {
			throw new Error("Only committee members can archive events");
		}

		return await ctx.db.patch(args.id, {
			isActive: false,
			updatedAt: Date.now()
		});
	}
});
