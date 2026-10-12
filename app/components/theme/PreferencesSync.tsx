"use client";

import { useEffect, useRef } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useTheme } from "./ThemeProvider";
import { useTextSize } from "./TextSizeProvider";

/**
 * Keeps display settings on a signed-in person's account so they follow them
 * to every device. Signed-out residents are untouched: their settings live in
 * localStorage only, and nothing here runs for them.
 *
 * On sign-in the account wins (it's the settings they chose elsewhere). An
 * account with nothing saved yet adopts this device's settings instead.
 * After that, every change made here is written back to the account.
 */
export default function PreferencesSync() {
	const { isAuthenticated } = useConvexAuth();
	const remote = useQuery(
		api.users.getMyPreferences,
		isAuthenticated ? {} : "skip"
	);
	const save = useMutation(api.users.setMyPreferences);
	const { theme, setTheme } = useTheme();
	const { textSize, setTextSize } = useTextSize();
	const hasReconciled = useRef(false);

	useEffect(() => {
		if (!isAuthenticated) {
			hasReconciled.current = false;
			return;
		}
		// undefined = loading; null = UserSync hasn't created the row yet
		if (!remote || hasReconciled.current) return;
		hasReconciled.current = true;

		if (remote.theme || remote.textSize) {
			if (remote.theme && remote.theme !== theme) setTheme(remote.theme);
			if (remote.textSize && remote.textSize !== textSize) {
				setTextSize(remote.textSize);
			}
		} else {
			save({ preferences: { theme, textSize } }).catch(() => {
				hasReconciled.current = false;
			});
		}
		// Reconcile once per sign-in; later local changes are handled below.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isAuthenticated, remote]);

	useEffect(() => {
		if (!isAuthenticated || !remote || !hasReconciled.current) return;
		if (remote.theme === theme && remote.textSize === textSize) return;
		save({ preferences: { theme, textSize } }).catch(() => {
			// Not fatal: the setting still applies on this device
		});
		// Only local changes should push; remote updates are not echoed back.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [theme, textSize]);

	return null;
}
