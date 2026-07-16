"use client";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";
import { ReactNode } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Clerk v6's UseAuthReturn loading branch omits sessionClaims, which
// convex@1.17's UseAuth type marks required — runtime shapes match, only
// the type unions disagree, hence the cast.
const useAuthForConvex = useAuth as unknown as React.ComponentProps<
	typeof ConvexProviderWithClerk
>["useAuth"];

// Must be rendered INSIDE ClerkProvider — useAuth supplies the Clerk JWT
// so Convex queries/mutations run with a verified identity (ctx.auth).
export function ConvexClientProvider({ children }: { children: ReactNode }) {
	return (
		<ConvexProviderWithClerk client={convex} useAuth={useAuthForConvex}>
			{children}
		</ConvexProviderWithClerk>
	);
}
