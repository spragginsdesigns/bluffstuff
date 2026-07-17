"use client";

import { usePathname } from "next/navigation";
import { MOBILE_TABS } from "../config/nav";
import { scrollToSection } from "../utils/scroll";

const TAB_ICONS: Record<string, React.ReactNode> = {
	top: (
		<svg
			className="w-6 h-6"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			aria-hidden="true"
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={1.8}
				d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
			/>
		</svg>
	),
	events: (
		<svg
			className="w-6 h-6"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			aria-hidden="true"
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={1.8}
				d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
			/>
		</svg>
	),
	calendar: (
		<svg
			className="w-6 h-6"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			aria-hidden="true"
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={1.8}
				d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
		</svg>
	),
	contact: (
		<svg
			className="w-6 h-6"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			aria-hidden="true"
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={1.8}
				d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
			/>
		</svg>
	)
};

export default function MobileTabBar() {
	const pathname = usePathname();

	// Only useful on the single-page home layout
	if (pathname !== "/") return null;

	return (
		<nav
			aria-label="Quick navigation"
			className="md:hidden print:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/90 backdrop-blur-lg border-t border-border pb-[env(safe-area-inset-bottom)]"
		>
			<div className="grid grid-cols-4">
				{MOBILE_TABS.map((tab) => (
					<button
						key={tab.id}
						onClick={() => scrollToSection(tab.id, pathname)}
						className="flex flex-col items-center justify-center gap-1 py-2.5 text-ink-faint hover:text-ink active:text-primary transition-colors min-h-[56px]"
					>
						{TAB_ICONS[tab.id]}
						<span className="text-[11px] font-medium">{tab.label}</span>
					</button>
				))}
			</div>
		</nav>
	);
}
