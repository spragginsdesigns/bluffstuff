"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { useIsCommittee } from "@/app/hooks/useIsCommittee";
import { useRouter } from "next/navigation";

export default function SeedPage() {
	const seedUsers = useMutation(api.seed.seedUsers);
	const [status, setStatus] = useState<string>("");
	const { isCommittee, isLoaded } = useIsCommittee();
	const router = useRouter();

	if (!isLoaded) return null;

	if (!isCommittee) {
		router.push("/");
		return null;
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
				`Error initializing database: ${error?.message || "Unknown error"}`
			);
		}
	};

	return (
		<div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
			<h1 className="text-3xl font-bold mb-4">Database Initialization</h1>
			<p className="text-xl mb-8">{status || "Ready to initialize..."}</p>
			<button
				onClick={() => void handleSeed()}
				className="px-6 py-3 bg-pink-600 hover:bg-pink-700 transition-colors rounded-lg text-white"
			>
				Initialize Database
			</button>
		</div>
	);
}
