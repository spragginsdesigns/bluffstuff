import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useIsCommittee() {
	const { isLoaded, isSignedIn, user } = useUser();
	const email = user?.primaryEmailAddress?.emailAddress ?? "";

	const convexUser = useQuery(
		api.users.getUser,
		email ? { email } : "skip"
	);

	const isCommittee =
		isLoaded && isSignedIn && convexUser?.role === "committee";

	return { isCommittee, isLoaded, isSignedIn, user, email };
}
