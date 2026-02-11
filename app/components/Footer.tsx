"use client";

export default function Footer() {
	const scrollTo = (id: string) => {
		document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
	};

	return (
		<footer className="text-white border-t border-gray-800/50">
			<div className="container mx-auto px-6 py-10">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					<div>
						<h3 className="text-lg font-semibold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
							Bluff Stuff
						</h3>
						<p className="text-gray-400 text-sm leading-relaxed">
							The Woodward Bluffs Activities Committee bringing our community
							together through fun events and activities.
						</p>
					</div>
					<div>
						<h3 className="text-lg font-semibold mb-3">Quick Links</h3>
						<ul className="space-y-2">
							<li>
								<button
									onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
									className="text-gray-400 hover:text-white text-sm transition-colors"
								>
									Home
								</button>
							</li>
							<li>
								<button
									onClick={() => scrollTo("events")}
									className="text-gray-400 hover:text-white text-sm transition-colors"
								>
									Events
								</button>
							</li>
							<li>
								<button
									onClick={() => scrollTo("committee")}
									className="text-gray-400 hover:text-white text-sm transition-colors"
								>
									Committee
								</button>
							</li>
							<li>
								<button
									onClick={() => scrollTo("contact")}
									className="text-gray-400 hover:text-white text-sm transition-colors"
								>
									Contact Us
								</button>
							</li>
						</ul>
					</div>
					<div>
						<h3 className="text-lg font-semibold mb-3">Community Info</h3>
						<ul className="text-gray-400 text-sm space-y-2">
							<li>Woodward Bluffs Mobile Home Park</li>
							<li>Fresno, CA</li>
							<li className="pt-2 text-gray-500">
								Committee meetings: First Monday of every month
							</li>
						</ul>
					</div>
				</div>
				<div className="mt-8 border-t border-gray-800/50 pt-6 text-center text-gray-500 text-sm">
					<p>
						&copy; {new Date().getFullYear()} Bluff Stuff &middot; Woodward
						Bluffs Activities Committee
					</p>
				</div>
			</div>
		</footer>
	);
}
