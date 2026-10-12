import { ConvexError } from "convex/values";

const DEFAULT_MESSAGE = "Something went wrong. Please try again.";

/**
 * The message a resident should see for a caught error. Only a ConvexError
 * with a string payload carries text written for residents (production
 * Convex replaces plain Error messages with "[CONVEX M(...)] Server Error"),
 * so anything else gets a calm, generic fallback instead of raw internals.
 */
export function friendlyError(
	err: unknown,
	fallback: string = DEFAULT_MESSAGE
): string {
	if (err instanceof ConvexError && typeof err.data === "string" && err.data) {
		return err.data;
	}
	return fallback;
}
