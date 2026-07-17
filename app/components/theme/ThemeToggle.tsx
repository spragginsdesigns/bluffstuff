"use client";

import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
	const { toggle } = useTheme();

	return (
		<button
			type="button"
			onClick={toggle}
			aria-label="Toggle light or dark theme"
			className="flex h-11 w-11 items-center justify-center rounded-xl text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
		>
			{/* Sun — shown in dark mode (icons swap via CSS so SSR never mismatches) */}
			<svg
				className="hidden h-6 w-6 dark:block"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				strokeWidth={2}
				aria-hidden="true"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M12 3v2m0 14v2M5.05 5.05l1.41 1.41m11.08 11.08l1.41 1.41M3 12h2m14 0h2M5.05 18.95l1.41-1.41M17.54 6.46l1.41-1.41M12 8a4 4 0 100 8 4 4 0 000-8z"
				/>
			</svg>
			{/* Moon — shown in light mode */}
			<svg
				className="h-6 w-6 dark:hidden"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				strokeWidth={2}
				aria-hidden="true"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
				/>
			</svg>
		</button>
	);
}
