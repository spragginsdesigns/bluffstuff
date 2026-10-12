"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "bs-contact";

export interface SavedContact {
	name: string;
	email: string;
	phone: string;
}

const EMPTY: SavedContact = { name: "", email: "", phone: "" };

function isSavedContact(value: unknown): value is SavedContact {
	if (!value || typeof value !== "object") return false;
	const v = value as Record<string, unknown>;
	return (
		typeof v.name === "string" &&
		typeof v.email === "string" &&
		typeof v.phone === "string"
	);
}

/**
 * "Remember me on this phone" for the RSVP form - the account-free way to
 * never type your name twice. Stored in this browser only; nothing is sent
 * anywhere until the resident submits an RSVP.
 *
 * `contact` is `undefined` until localStorage has been read (after mount), so
 * server and client markup match.
 */
export function useSavedContact() {
	const [contact, setContact] = useState<SavedContact>();

	useEffect(() => {
		try {
			const raw = window.localStorage.getItem(STORAGE_KEY);
			const parsed: unknown = raw ? JSON.parse(raw) : null;
			setContact(isSavedContact(parsed) ? parsed : EMPTY);
		} catch {
			setContact(EMPTY);
		}
	}, []);

	const save = useCallback((next: SavedContact) => {
		try {
			window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
		} catch {
			// storage blocked - nothing to remember, the RSVP still went through
		}
		setContact(next);
	}, []);

	const forget = useCallback(() => {
		try {
			window.localStorage.removeItem(STORAGE_KEY);
		} catch {
			// storage blocked - nothing was saved anyway
		}
		setContact(EMPTY);
	}, []);

	return { contact, save, forget };
}
