import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { requireCommittee } from "./committeeAuth";

export const submit = mutation({
	args: {
		name: v.string(),
		email: v.optional(v.string()),
		phone: v.optional(v.string()),
		subject: v.string(),
		message: v.string()
	},
	handler: async (ctx, args) => {
		// Plenty of residents would rather leave a phone number than an email.
		// Either is fine, but the committee needs some way to reply. ConvexError
		// so production shows this text instead of a generic "Server Error".
		const email = args.email?.trim() || undefined;
		const phone = args.phone?.trim() || undefined;
		if (!email && !phone) {
			throw new ConvexError(
				"Please leave an email or a phone number so we can reply."
			);
		}

		return await ctx.db.insert("contactMessages", {
			...args,
			email,
			phone,
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

/** Mark handled/unhandled so the dashboard badge means "still needs a reply". */
export const setRead = mutation({
	args: { id: v.id("contactMessages"), isRead: v.boolean() },
	handler: async (ctx, args) => {
		await requireCommittee(ctx);
		return await ctx.db.patch(args.id, { isRead: args.isRead });
	}
});

export const remove = mutation({
	args: { id: v.id("contactMessages") },
	handler: async (ctx, args) => {
		await requireCommittee(ctx);
		return await ctx.db.delete(args.id);
	}
});
