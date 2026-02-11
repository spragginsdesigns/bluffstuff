import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get user by email
export const getUser = query({
	args: { email: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("users")
			.filter((q) => q.eq(q.field("email"), args.email))
			.first();
	}
});

// Get all committee members
export const getCommitteeMembers = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db
			.query("users")
			.filter((q) => q.eq(q.field("role"), "committee"))
			.collect();
	}
});

// Create or update user
export const upsertUser = mutation({
	args: {
		email: v.string(),
		name: v.string(),
		imageUrl: v.optional(v.string()),
		role: v.string()
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("users")
			.filter((q) => q.eq(q.field("email"), args.email))
			.first();

		if (existing) {
			return await ctx.db.patch(existing._id, {
				name: args.name,
				imageUrl: args.imageUrl,
				lastLoginAt: Date.now()
			});
		}

		return await ctx.db.insert("users", {
			...args,
			createdAt: Date.now(),
			lastLoginAt: Date.now()
		});
	}
});
