"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { NAV_LINKS } from "../config/nav";
import { scrollToSection } from "../utils/scroll";
import { useIsCommittee } from "../hooks/useIsCommittee";
import { buttonClasses } from "./ui/Button";
import ThemeToggle from "./theme/ThemeToggle";

export default function NavBar() {
	const [isOpen, setIsOpen] = useState(false);
	const pathname = usePathname();
	const { isCommittee } = useIsCommittee();

	const scrollTo = (id: string) => {
		setIsOpen(false);
		scrollToSection(id, pathname);
	};

	const linkClasses =
		"text-ink-muted hover:text-ink px-3 py-2 rounded-lg text-base font-medium hover:bg-surface-2 transition-colors";

	// Visually distinct from the public section links — it goes somewhere else
	// entirely, and only the committee ever sees it.
	const dashboardClasses =
		"px-3 py-2 rounded-lg text-base font-medium bg-primary-soft text-primary-strong hover:bg-primary-soft/70 transition-colors";

	return (
		<nav className="bg-surface/80 backdrop-blur-md border-b border-border">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-16">
					<div className="flex items-center">
						<Link href="/" className="flex-shrink-0 flex items-center gap-2">
							<Image
								src="/logo.png"
								alt="Bluff Stuff Logo"
								width={32}
								height={32}
								className="rounded-full"
							/>
							<span className="font-display text-xl font-bold text-primary">
								Bluff Stuff
							</span>
						</Link>
					</div>

					{/* Desktop menu */}
					<div className="hidden md:block">
						<div className="ml-10 flex items-center space-x-1">
							<Link href="/" className={linkClasses}>
								Home
							</Link>
							{NAV_LINKS.map(({ id, label }) => (
								<button
									key={id}
									onClick={() => scrollTo(id)}
									className={linkClasses}
								>
									{label}
								</button>
							))}
							{isCommittee && (
								<Link href="/admin" className={dashboardClasses}>
									Dashboard
								</Link>
							)}
							<ThemeToggle />
							<SignedOut>
								<SignInButton mode="modal">
									<button className={buttonClasses("primary", "md", "ml-2")}>
										Sign In
									</button>
								</SignInButton>
							</SignedOut>
							<SignedIn>
								<UserButton
									afterSignOutUrl="/"
									appearance={{
										elements: { avatarBox: "w-9 h-9" }
									}}
								/>
							</SignedIn>
						</div>
					</div>

					{/* Mobile menu button */}
					<div className="md:hidden flex items-center gap-2">
						<ThemeToggle />
						<SignedIn>
							<UserButton
								afterSignOutUrl="/"
								appearance={{
									elements: { avatarBox: "w-8 h-8" }
								}}
							/>
						</SignedIn>
						<button
							onClick={() => setIsOpen(!isOpen)}
							className="inline-flex items-center justify-center p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors"
							aria-label="Toggle menu"
							aria-expanded={isOpen}
						>
							{!isOpen ? (
								<svg
									className="block h-6 w-6"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-hidden="true"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M4 6h16M4 12h16M4 18h16"
									/>
								</svg>
							) : (
								<svg
									className="block h-6 w-6"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-hidden="true"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							)}
						</button>
					</div>
				</div>
			</div>

			{/* Mobile menu */}
			{isOpen && (
				<div className="md:hidden border-t border-border bg-surface">
					<div className="px-4 pt-3 pb-4 space-y-1">
						<Link
							href="/"
							onClick={() => setIsOpen(false)}
							className={`${linkClasses} block`}
						>
							Home
						</Link>
						{NAV_LINKS.map(({ id, label }) => (
							<button
								key={id}
								onClick={() => scrollTo(id)}
								className={`${linkClasses} block w-full text-left`}
							>
								{label}
							</button>
						))}
						{isCommittee && (
							<Link
								href="/admin"
								onClick={() => setIsOpen(false)}
								className={`${dashboardClasses} block`}
							>
								Dashboard
							</Link>
						)}
						<SignedOut>
							<div className="pt-2">
								<SignInButton mode="modal">
									<button className={buttonClasses("primary", "md", "w-full")}>
										Sign In
									</button>
								</SignInButton>
							</div>
						</SignedOut>
					</div>
				</div>
			)}
		</nav>
	);
}
