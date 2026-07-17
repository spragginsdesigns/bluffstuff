"use client";

import { dark } from "@clerk/themes";
import { useTheme, type Theme } from "../components/theme/ThemeProvider";

export function getClerkAppearance(theme: Theme) {
	return {
		baseTheme: theme === "dark" ? dark : undefined,
		variables: {
			colorPrimary: theme === "dark" ? "#E0714A" : "#B54323",
			borderRadius: "0.75rem",
			fontFamily: "var(--font-body), system-ui, sans-serif"
		},
		elements: {
			formButtonPrimary:
				"bg-primary hover:bg-primary-strong text-primary-fg normal-case",
			card: "bg-surface border border-border shadow-card"
		}
	};
}

export function useClerkAppearance() {
	const { theme } = useTheme();
	return getClerkAppearance(theme);
}
