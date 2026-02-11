"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";

const ADMIN_EMAIL = "atmosphere9999@gmail.com";

export default function SeedPage() {
	const seedUsers = useMutation(api.seed.seedUsers);
	const [status, setStatus] = useState<string>("");
	const { user, isLoaded } = useUser();

	if (!isLoaded) return null;

	// Only the admin email can access this page (direct check, no Convex dependency)
	const isAdmin =
		user?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL;

	if (!isAdmin) {
		return (
			<div className="flex items-center justify-center min-h-[70vh] text-center px-4">
				<p className="text-gray-400">Access denied.</p>
			</div>
		);
	}

	const handleSeed = async () => {
		try {
			const result = await seedUsers();
			if (result?.message) {
				setStatus(result.message);
			}
		} catch (err) {
			const error = err as Error;
			setStatus(
				`Error: ${error?.message || "Unknown error"}`
			);
		}
	};

	return (
		<div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
			<h1 className="text-3xl font-bold mb-4">Database Initialization</h1>
			<p className="text-gray-400 mb-2 text-sm">
				Signed in as {user?.primaryEmailAddress?.emailAddress}
			</p>
			<p className="text-xl mb-8">{status || "Ready to initialize..."}</p>
			<button
				onClick={() => void handleSeed()}
				className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 transition-colors rounded-xl text-white font-medium"
			>
				Initialize / Upgrade Admin
			</button>
		</div>
	);
}
