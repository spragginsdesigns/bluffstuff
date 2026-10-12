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

const preferencesValidator = v.object({
	theme: v.optional(v.union(v.literal("light"), v.literal("dark"))),
	textSize: v.optional(
		v.union(v.literal("normal"), v.literal("large"), v.literal("xlarge"))
	)
});

// Display settings synced for signed-in people. Keyed ONLY on the Clerk JWT
// identity - never a client-supplied email - so nobody can read or overwrite
// another person's settings. Signed-out residents keep theirs in localStorage.
export const getMyPreferences = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		const email = identity?.email;
		if (!email) return null;

		const user = await ctx.db
			.query("users")
			.withIndex("by_email", (q) => q.eq("email", email))
			.first();
		// `null` = no account row yet; `{}`-ish = account with nothing saved
		return user ? (user.preferences ?? {}) : null;
	}
});

export const setMyPreferences = mutation({
	args: { preferences: preferencesValidator },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		const email = identity?.email;
		if (!email) {
			throw new Error("Sign in to save settings to your account");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_email", (q) => q.eq("email", email))
			.first();
		if (!user) {
			// UserSync hasn't created the row yet; the next change will land.
			return null;
		}

		return await ctx.db.patch(user._id, {
			preferences: { ...user.preferences, ...args.preferences }
		});
	}
});

// Create or update user from Clerk sign-in
// Role is NOT accepted from client — new users default to "resident",
// existing users keep their current role.
export const upsertUser = mutation({
	args: {
		email: v.string(),
		name: v.string(),
		imageUrl: v.optional(v.string())
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
			email: args.email,
			name: args.name,
			imageUrl: args.imageUrl,
			role: "resident",
			createdAt: Date.now(),
			lastLoginAt: Date.now()
		});
	}
});
