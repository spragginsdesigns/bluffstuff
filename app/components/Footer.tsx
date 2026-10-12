"use client";

import Link from "next/link";
import { SignedOut } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { NAV_LINKS } from "../config/nav";
import { scrollToSection } from "../utils/scroll";

export default function Footer() {
	const pathname = usePathname();

	return (
		<footer className="border-t border-border">
			<div className="container mx-auto px-6 py-10">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					<div>
						<h3 className="font-display text-lg font-semibold mb-3 text-primary">
							Bluff Stuff
						</h3>
						<p className="text-ink-muted text-base leading-relaxed">
							The Woodward Bluffs Activities Committee bringing our community
							together through fun events and activities.
						</p>
					</div>
					<div>
						<h3 className="text-lg font-semibold mb-3 text-ink">Quick Links</h3>
						<ul className="space-y-2">
							<li>
								<button
									onClick={() => scrollToSection("top", pathname)}
									className="text-ink-muted hover:text-ink text-base transition-colors"
								>
									Home
								</button>
							</li>
							{NAV_LINKS.map(({ id, label }) => (
								<li key={id}>
									<button
										onClick={() => scrollToSection(id, pathname)}
										className="text-ink-muted hover:text-ink text-base transition-colors"
									>
										{label}
									</button>
								</li>
							))}
						</ul>
					</div>
					<div>
						<h3 className="text-lg font-semibold mb-3 text-ink">
							Community Info
						</h3>
						<ul className="text-ink-muted text-base space-y-2">
							<li>Woodward Bluffs Mobile Home Park</li>
							<li>Fresno, CA</li>
							<li className="pt-2 text-ink-faint">
								Committee meetings: First Monday of every month
							</li>
						</ul>
					</div>
				</div>
				<div className="mt-8 border-t border-border pt-6 text-center text-ink-faint text-sm">
					<p>
						&copy; {new Date().getFullYear()} Bluff Stuff &middot; Woodward
						Bluffs Activities Committee
					</p>
					{/* The only sign-in entry point on the site. Residents never need
					    one, so it stays small and out of the way. */}
					<SignedOut>
						<Link
							href="/sign-in"
							className="inline-block mt-3 underline underline-offset-2 hover:text-ink transition-colors"
						>
							Committee sign-in
						</Link>
					</SignedOut>
				</div>
			</div>
		</footer>
	);
}
