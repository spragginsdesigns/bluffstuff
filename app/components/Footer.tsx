"use client";

import { usePathname } from "next/navigation";
import { NAV_LINKS } from "../config/nav";
import { scrollToSection } from "../utils/scroll";

// Finger-sized rows: the links sit close together, and a miss scrolls the
// page somewhere unexpected.
const linkClasses =
	"inline-flex items-center min-h-[44px] text-ink-muted hover:text-ink text-base transition-colors";

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
						<ul>
							<li>
								<button
									onClick={() => scrollToSection("top", pathname)}
									className={linkClasses}
								>
									Home
								</button>
							</li>
							{NAV_LINKS.map(({ id, label }) => (
								<li key={id}>
									<button
										onClick={() => scrollToSection(id, pathname)}
										className={linkClasses}
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
							<li className="pt-2 text-ink-muted">
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
				</div>
			</div>
		</footer>
	);
}
