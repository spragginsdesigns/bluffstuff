import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireCommitteeSecret } from "./events";

/**
 * Online payment records. Written only by the Next.js /pay/success page
 * after it verifies the Checkout session with Stripe server-side — the
 * browser never calls this directly, so it carries the committee secret.
 */
export const record = mutation({
	args: {
		eventId: v.id("events"),
		stripeSessionId: v.string(),
		payerName: v.string(),
		payerEmail: v.string(),
		amountCents: v.number(),
		confirmationCode: v.string(),
		secret: v.string()
	},
	handler: async (ctx, args) => {
		requireCommitteeSecret(args.secret);

		// Idempotent: refreshing the success page must not duplicate the record
		const existing = await ctx.db
			.query("payments")
			.withIndex("by_session", (q) =>
				q.eq("stripeSessionId", args.stripeSessionId)
			)
			.first();
		if (existing) {
			return existing._id;
		}

		const { secret, ...fields } = args;
		return await ctx.db.insert("payments", {
			...fields,
			createdAt: Date.now()
		});
	}
});

export const listByEvent = query({
	args: { eventId: v.id("events") },
	handler: async (ctx, args) => {
		// Payer names/emails are PII — committee only
		const identity = await ctx.auth.getUserIdentity();
		if (!identity?.email) {
			return null;
		}
		const caller = await ctx.db
			.query("users")
			.withIndex("by_email", (q) => q.eq("email", identity.email!))
			.first();
		if (caller?.role !== "committee") {
			return null;
		}

		return await ctx.db
			.query("payments")
			.withIndex("by_event", (q) => q.eq("eventId", args.eventId))
			.collect();
	}
});
