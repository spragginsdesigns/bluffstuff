import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
	"/",
	"/qr",
	"/flyer(.*)",
	"/api/flyer(.*)",
	// Post-event feedback is intentionally login-free — see app/feedback
	"/feedback(.*)",
	// Vercel Cron has no Clerk session; the route authenticates the caller
	// itself with a CRON_SECRET bearer token.
	"/api/sendReminders",
	"/pay(.*)",
	"/api/checkout",
	"/sign-in(.*)",
	"/sign-up(.*)",
	"/api/uploadthing"
]);

export default clerkMiddleware(async (auth, request) => {
	if (!isPublicRoute(request)) {
		await auth.protect();
	}
});

export const config = {
	matcher: [
		// Skip Next.js internals and all static files, unless found in search params
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		// Always run for API routes
		"/(api|trpc)(.*)"
	]
};
