import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	users: defineTable({
		email: v.string(),
		name: v.string(),
		imageUrl: v.optional(v.string()),
		role: v.string(), // "committee" or "resident"
		// Display settings that follow a signed-in person across devices.
		// Signed-out residents keep the same settings in localStorage only.
		preferences: v.optional(
			v.object({
				theme: v.optional(v.union(v.literal("light"), v.literal("dark"))),
				textSize: v.optional(
					v.union(
						v.literal("normal"),
						v.literal("large"),
						v.literal("xlarge")
					)
				)
			})
		),
		createdAt: v.number(),
		lastLoginAt: v.number()
	}).index("by_email", ["email"]),

	events: defineTable({
		title: v.string(),
		description: v.string(),
		date: v.string(), // ISO date string (YYYY-MM-DD)
		time: v.string(), // e.g. "6:00 PM"
		location: v.string(),
		imageUrl: v.optional(v.string()),
		priceCents: v.optional(v.number()), // 0 or absent = free event
		createdBy: v.string(), // email of creator
		isActive: v.boolean(),
		// Headcount the committee records after the event. Absent = not counted
		// yet, which is meaningfully different from a recorded 0.
		attendanceCount: v.optional(v.number()),
		attendanceNote: v.optional(v.string()), // weather, conflicts, anything odd
		// Set once the day-before reminder has gone out. Absent = not sent.
		// This is the idempotency key for the cron: a retry must never
		// double-email residents.
		reminderSentAt: v.optional(v.number()),
		// Set once the day-after thank-you (with the feedback link) has gone
		// out. Same idempotency role as reminderSentAt, for the same cron.
		thankYouSentAt: v.optional(v.number()),
		createdAt: v.number(),
		updatedAt: v.number()
	})
		.index("by_date", ["date"])
		.index("by_active", ["isActive"]),

	rsvps: defineTable({
		eventId: v.id("events"),
		name: v.string(),
		// Optional so a resident can RSVP with just a name. Without one they
		// simply get no day-before reminder email.
		email: v.optional(v.string()),
		phoneNumber: v.optional(v.string()),
		notes: v.optional(v.string()),
		// Headcount for this RSVP, the resident included. Absent = 1.
		partySize: v.optional(v.number()),
		// Browser-local id (useVisitorId) so the same phone can see, change or
		// cancel its own RSVP without an account. Absent on older rows.
		visitorId: v.optional(v.string()),
		createdAt: v.number()
	})
		.index("by_event", ["eventId"])
		.index("by_email", ["email"])
		.index("by_event_visitor", ["eventId", "visitorId"]),

	payments: defineTable({
		eventId: v.id("events"),
		stripeSessionId: v.string(),
		payerName: v.string(),
		payerEmail: v.string(),
		amountCents: v.number(),
		// People paid for (Stripe line-item quantity). Optional: rows from
		// before adjustable quantity existed were always one person.
		quantity: v.optional(v.number()),
		confirmationCode: v.string(),
		createdAt: v.number()
	})
		.index("by_event", ["eventId"])
		.index("by_session", ["stripeSessionId"]),

	contactMessages: defineTable({
		name: v.string(),
		// Email OR phone - at least one, enforced in contactMessages:submit.
		email: v.optional(v.string()),
		phone: v.optional(v.string()),
		subject: v.string(),
		message: v.string(),
		// Optional so existing rows stay valid; absent means unread.
		isRead: v.optional(v.boolean()),
		createdAt: v.number()
	}),

	// Post-event feedback. Deliberately anonymous and login-free: the people
	// worth hearing from are the ones who did NOT attend, and a sign-in wall
	// would filter them out entirely. `visitorId` is a random browser-local id
	// used only to dedupe and to let someone amend their own answer.
	eventFeedback: defineTable({
		eventId: v.id("events"),
		visitorId: v.string(),
		attended: v.boolean(),
		rating: v.optional(v.number()), // 1-5, attendees only
		reasons: v.optional(v.array(v.string())), // no-show reason keys
		comment: v.optional(v.string()),
		wants: v.optional(v.string()), // what they'd like to see more of
		name: v.optional(v.string()), // optional — blank means anonymous
		createdAt: v.number(),
		updatedAt: v.number()
	})
		.index("by_event", ["eventId"])
		.index("by_event_visitor", ["eventId", "visitorId"]),

	// One-tap "I'd come to this" signal on upcoming events. Lighter than an
	// RSVP so the committee can gauge demand before buying supplies.
	eventInterest: defineTable({
		eventId: v.id("events"),
		visitorId: v.string(),
		createdAt: v.number()
	})
		.index("by_event", ["eventId"])
		.index("by_event_visitor", ["eventId", "visitorId"]),

	// Resident-suggested event ideas. Auto-published; the committee can hide
	// anything inappropriate rather than gate every idea behind approval.
	eventIdeas: defineTable({
		title: v.string(),
		details: v.optional(v.string()),
		submittedBy: v.optional(v.string()), // optional name
		visitorId: v.string(),
		isHidden: v.boolean(),
		createdAt: v.number()
	}).index("by_hidden", ["isHidden"]),

	ideaVotes: defineTable({
		ideaId: v.id("eventIdeas"),
		visitorId: v.string(),
		createdAt: v.number()
	})
		.index("by_idea", ["ideaId"])
		.index("by_idea_visitor", ["ideaId", "visitorId"])
});
