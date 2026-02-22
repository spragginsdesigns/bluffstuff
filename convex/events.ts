import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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
		createdBy: v.string()
	},
	handler: async (ctx, args) => {
		// Verify creator is a committee member
		const user = await ctx.db
			.query("users")
			.filter((q) => q.eq(q.field("email"), args.createdBy))
			.first();

		if (!user || user.role !== "committee") {
			throw new Error("Only committee members can create events");
		}

		return await ctx.db.insert("events", {
			...args,
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
		updaterEmail: v.string()
	},
	handler: async (ctx, args) => {
		const user = await ctx.db
			.query("users")
			.filter((q) => q.eq(q.field("email"), args.updaterEmail))
			.first();

		if (!user || user.role !== "committee") {
			throw new Error("Only committee members can update events");
		}

		const { id, updaterEmail, ...updates } = args;
		const cleanUpdates: Record<string, unknown> = { updatedAt: Date.now() };
		for (const [key, value] of Object.entries(updates)) {
			if (value !== undefined) {
				cleanUpdates[key] = value;
			}
		}

		return await ctx.db.patch(id, cleanUpdates);
	}
});

export const archive = mutation({
	args: {
		id: v.id("events"),
		archiverEmail: v.string()
	},
	handler: async (ctx, args) => {
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
