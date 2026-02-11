import { mutation } from "./_generated/server";

const ADMIN_EMAIL = "atmosphere9999@gmail.com";

export const seedUsers = mutation({
	args: {},
	handler: async (ctx) => {
		const existing = await ctx.db
			.query("users")
			.filter((q) => q.eq(q.field("email"), ADMIN_EMAIL))
			.first();

		if (existing) {
			// Always ensure admin has committee role (handles upgrade from "resident")
			if (existing.role !== "committee") {
				await ctx.db.patch(existing._id, { role: "committee" });
				return { message: "Admin upgraded to committee role" };
			}
			return { message: "Admin already has committee role" };
		}

		// Create admin user if they don't exist yet
		await ctx.db.insert("users", {
			email: ADMIN_EMAIL,
			name: "Austin Spraggins",
			role: "committee",
			createdAt: Date.now(),
			lastLoginAt: Date.now()
		});

		return { message: "Admin user created with committee role" };
	}
});
