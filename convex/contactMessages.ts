import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const submit = mutation({
	args: {
		name: v.string(),
		email: v.string(),
		phone: v.optional(v.string()),
		subject: v.string(),
		message: v.string()
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("contactMessages", {
			...args,
			createdAt: Date.now()
		});
	}
});

export const list = query({
	args: {},
	handler: async (ctx) => {
		// Identity comes from the Clerk JWT — not a client-supplied email
		const identity = await ctx.auth.getUserIdentity();
		if (!identity?.email) {
			return [];
		}

		const user = await ctx.db
			.query("users")
			.filter((q) => q.eq(q.field("email"), identity.email))
			.first();

		if (!user || user.role !== "committee") {
			return [];
		}

		return await ctx.db
			.query("contactMessages")
			.order("desc")
			.collect();
	}
});
