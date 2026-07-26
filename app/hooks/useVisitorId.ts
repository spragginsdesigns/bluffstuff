"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "bluffstuff:visitorId";

/**
 * A random, browser-local id used to dedupe anonymous actions — feedback,
 * interest taps, idea votes — without asking anyone to sign in.
 *
 * It is not an identity and carries nothing about the person. Someone using
 * two devices counts twice, and clearing site data resets it. That looseness
 * is the trade we want: a sign-in wall would cost us the responses from the
 * residents we most need to hear from.
 *
 * Returns `undefined` on the first render so the server and client markup
 * match; callers should `"skip"` their queries until it resolves.
 */
export function useVisitorId(): string | undefined {
	const [visitorId, setVisitorId] = useState<string>();

	useEffect(() => {
		try {
			const existing = window.localStorage.getItem(STORAGE_KEY);
			if (existing) {
				setVisitorId(existing);
				return;
			}
			const created = createId();
			window.localStorage.setItem(STORAGE_KEY, created);
			setVisitorId(created);
		} catch {
			// Private browsing or storage blocked — use a session-only id so the
			// form still submits. It just won't dedupe across reloads.
			setVisitorId(createId());
		}
	}, []);

	return visitorId;
}

function createId(): string {
	if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
		return crypto.randomUUID();
	}
	return `v-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}
