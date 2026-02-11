"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function UserSync() {
	const { isSignedIn, user } = useUser();
	const upsertUser = useMutation(api.users.upsertUser);
	const hasSynced = useRef(false);

	useEffect(() => {
		if (!isSignedIn || !user || hasSynced.current) return;

		const email = user.primaryEmailAddress?.emailAddress;
		if (!email) return;

		hasSynced.current = true;
		upsertUser({
			email,
			name: user.fullName ?? user.firstName ?? "Resident",
			imageUrl: user.imageUrl ?? undefined
		}).catch(() => {
			// Reset so it retries next render
			hasSynced.current = false;
		});
	}, [isSignedIn, user, upsertUser]);

	return null;
}
