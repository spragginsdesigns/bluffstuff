import { mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { v } from "convex/values";
import { isCommittee, requireCommittee } from "./committeeAuth";
import {
	MAX_IDEA_DETAILS_LENGTH,
	MAX_IDEA_TITLE_LENGTH,
	MAX_NAME_LENGTH
} from "./feedbackOptions";

/**
 * Resident idea board. Voting is a single tap because typing is the barrier
 * for a lot of this park — one person writes "bingo night", forty people tap
 * it, and the committee has a ranked list of what to plan next.
 *
 * Ideas publish immediately (an approval queue kills the momentum that makes
 * a board like this work) and the committee can hide anything unsuitable.
 */

const MAX_VISITOR_ID_LENGTH = 64;

function cleanText(
	value: string | undefined,
	maxLength: number
): string | undefined {
	const trimmed = value?.trim();
	return trimmed ? trimmed.slice(0, maxLength) : undefined;
}

function requireVisitorId(raw: string): string {
	const visitorId = raw.trim().slice(0, MAX_VISITOR_ID_LENGTH);
	if (!visitorId) {
		throw new Error("Missing visitor id");
	}
	return visitorId;
}

/**
 * Shapes an idea for the client. Note the explicit field list: `visitorId` is
 * the submitter's anonymous handle and must never leave the server, or the
 * board stops being anonymous the moment someone correlates two ideas.
 */
function withVoteCounts(
	ideas: Doc<"eventIdeas">[],
	votes: Doc<"ideaVotes">[],
	visitorId: string | undefined
) {
	return ideas.map((idea) => {
		const forIdea = votes.filter((vote) => vote.ideaId === idea._id);
		return {
			_id: idea._id,
			title: idea.title,
			details: idea.details,
			submittedBy: idea.submittedBy,
			isHidden: idea.isHidden,
			createdAt: idea.createdAt,
			voteCount: forIdea.length,
			hasVoted: visitorId
				? forIdea.some((vote) => vote.visitorId === visitorId)
				: false
		};
	});
}

export const list = query({
	args: { visitorId: v.optional(v.string()) },
	handler: async (ctx, args) => {
		const ideas = await ctx.db
			.query("eventIdeas")
			.withIndex("by_hidden", (q) => q.eq("isHidden", false))
			.collect();

		const votes = await ctx.db.query("ideaVotes").collect();
		return withVoteCounts(ideas, votes, args.visitorId).sort(
			(a, b) => b.voteCount - a.voteCount || b.createdAt - a.createdAt
		);
	}
});

export const submit = mutation({
	args: {
		title: v.string(),
		details: v.optional(v.string()),
		submittedBy: v.optional(v.string()),
		visitorId: v.string()
	},
	handler: async (ctx, args) => {
		const visitorId = requireVisitorId(args.visitorId);
		const title = cleanText(args.title, MAX_IDEA_TITLE_LENGTH);
		if (!title) {
			throw new Error("An idea needs a title");
		}

		const ideaId = await ctx.db.insert("eventIdeas", {
			title,
			details: cleanText(args.details, MAX_IDEA_DETAILS_LENGTH),
			submittedBy: cleanText(args.submittedBy, MAX_NAME_LENGTH),
			visitorId,
			isHidden: false,
			createdAt: Date.now()
		});

		// Suggesting an idea counts as voting for it, so a brand new idea never
		// shows a demoralising "0 votes".
		await ctx.db.insert("ideaVotes", {
			ideaId,
			visitorId,
			createdAt: Date.now()
		});

		return ideaId;
	}
});

export const toggleVote = mutation({
	args: { ideaId: v.id("eventIdeas"), visitorId: v.string() },
	handler: async (ctx, args) => {
		const visitorId = requireVisitorId(args.visitorId);

		const idea = await ctx.db.get(args.ideaId);
		if (!idea) {
			throw new Error("Idea not found");
		}

		const existing = await ctx.db
			.query("ideaVotes")
			.withIndex("by_idea_visitor", (q) =>
				q.eq("ideaId", args.ideaId).eq("visitorId", visitorId)
			)
			.first();

		if (existing) {
			await ctx.db.delete(existing._id);
			return { hasVoted: false };
		}

		await ctx.db.insert("ideaVotes", {
			ideaId: args.ideaId,
			visitorId,
			createdAt: Date.now()
		});
		return { hasVoted: true };
	}
});

/** Committee-only: includes hidden ideas so they can be un-hidden. */
export const listForCommittee = query({
	args: {},
	handler: async (ctx) => {
		if (!(await isCommittee(ctx))) {
			return [];
		}
		const ideas = await ctx.db.query("eventIdeas").order("desc").collect();
		const votes = await ctx.db.query("ideaVotes").collect();
		return withVoteCounts(ideas, votes, undefined).sort(
			(a, b) => b.voteCount - a.voteCount
		);
	}
});

export const setHidden = mutation({
	args: { ideaId: v.id("eventIdeas"), isHidden: v.boolean() },
	handler: async (ctx, args) => {
		await requireCommittee(ctx);
		return await ctx.db.patch(args.ideaId, { isHidden: args.isHidden });
	}
});

/** Permanent removal for spam. Takes the idea's votes with it — an orphaned
 *  vote row would keep inflating nothing forever. Prefer `setHidden` for
 *  anything you might want back. */
export const remove = mutation({
	args: { ideaId: v.id("eventIdeas") },
	handler: async (ctx, args) => {
		await requireCommittee(ctx);

		const votes = await ctx.db
			.query("ideaVotes")
			.withIndex("by_idea", (q) => q.eq("ideaId", args.ideaId))
			.collect();
		for (const vote of votes) {
			await ctx.db.delete(vote._id);
		}

		return await ctx.db.delete(args.ideaId);
	}
});
