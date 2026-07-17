"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "./components/theme/ThemeProvider";
import { useClerkAppearance } from "./lib/clerkAppearance";

function ClerkWithTheme({ children }: { children: React.ReactNode }) {
	const appearance = useClerkAppearance();
	return <ClerkProvider appearance={appearance}>{children}</ClerkProvider>;
}

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider>
			<ClerkWithTheme>{children}</ClerkWithTheme>
		</ThemeProvider>
	);
}
