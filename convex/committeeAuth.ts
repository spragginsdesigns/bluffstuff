import { QueryCtx, MutationCtx } from "./_generated/server";

/**
 * Committee check for read paths and low-stakes moderation writes.
 *
 * Identity comes from the Clerk JWT (`ctx.auth`), never from a client-supplied
 * email. This is the same boundary `contactMessages:list` uses. High-stakes
 * event writes stay on the `COMMITTEE_API_SECRET` path in `events.ts`, which
 * also has to serve trusted agents calling Convex directly.
 */
export async function isCommittee(
	ctx: QueryCtx | MutationCtx
): Promise<boolean> {
	const identity = await ctx.auth.getUserIdentity();
	const email = identity?.email;
	if (!email) {
		return false;
	}

	const user = await ctx.db
		.query("users")
		.withIndex("by_email", (q) => q.eq("email", email))
		.first();

	return user?.role === "committee";
}

/** Same check, but for mutations that should hard-fail rather than return []. */
export async function requireCommittee(ctx: MutationCtx): Promise<void> {
	if (!(await isCommittee(ctx))) {
		throw new Error("Committee members only");
	}
}
