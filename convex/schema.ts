import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	users: defineTable({
		email: v.string(),
		name: v.string(),
		imageUrl: v.optional(v.string()),
		role: v.string(), // "committee" or "resident"
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
		createdBy: v.string(), // email of creator
		isActive: v.boolean(),
		createdAt: v.number(),
		updatedAt: v.number()
	})
		.index("by_date", ["date"])
		.index("by_active", ["isActive"]),

	rsvps: defineTable({
		eventId: v.id("events"),
		name: v.string(),
		email: v.string(),
		phoneNumber: v.optional(v.string()),
		notes: v.optional(v.string()),
		createdAt: v.number()
	})
		.index("by_event", ["eventId"])
		.index("by_email", ["email"]),

	contactMessages: defineTable({
		name: v.string(),
		email: v.string(),
		phone: v.optional(v.string()),
		subject: v.string(),
		message: v.string(),
		createdAt: v.number()
	})
});
