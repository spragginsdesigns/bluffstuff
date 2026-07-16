/**
 * Server-side Convex query via the HTTP API with caching disabled.
 * Next.js 14 caches fetch() inside route handlers, and ConvexHttpClient
 * rides on fetch — which served stale documents (e.g. an event queried
 * right after a mutation). `cache: "no-store"` guarantees fresh reads.
 * Mutations are unaffected; keep using ConvexHttpClient for those.
 */
export async function convexQuery<T>(
	path: string,
	args: Record<string, unknown>
): Promise<T> {
	const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
	if (!convexUrl) {
		throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
	}

	const res = await fetch(`${convexUrl}/api/query`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ path, args, format: "json" }),
		cache: "no-store"
	});
	if (!res.ok) {
		throw new Error(`Convex query ${path} failed with ${res.status}`);
	}

	const json = await res.json();
	if (json.status !== "success") {
		throw new Error(json.errorMessage ?? `Convex query ${path} errored`);
	}
	return json.value as T;
}
