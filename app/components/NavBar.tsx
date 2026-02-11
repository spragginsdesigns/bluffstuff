"use client";

import Link from "next/link";
import { useState } from "react";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

export default function NavBar() {
	const [isOpen, setIsOpen] = useState(false);
	const pathname = usePathname();

	const scrollTo = (id: string) => {
		setIsOpen(false);
		if (pathname !== "/") {
			window.location.href = `/#${id}`;
			return;
		}
		document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
	};

	return (
		<nav className="bg-gray-900/80 backdrop-blur-md border-b border-gray-800/50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-16">
					<div className="flex items-center">
						<Link href="/" className="flex-shrink-0">
							<span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
								Bluff Stuff
							</span>
						</Link>
					</div>

					{/* Desktop menu */}
					<div className="hidden md:block">
						<div className="ml-10 flex items-center space-x-1">
							<Link
								href="/"
								className="text-gray-300 hover:text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/5 transition-all"
							>
								Home
							</Link>
							<button
								onClick={() => scrollTo("events")}
								className="text-gray-300 hover:text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/5 transition-all"
							>
								Events
							</button>
							<button
								onClick={() => scrollTo("committee")}
								className="text-gray-300 hover:text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/5 transition-all"
							>
								Committee
							</button>
							<button
								onClick={() => scrollTo("contact")}
								className="text-gray-300 hover:text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/5 transition-all"
							>
								Contact
							</button>
							<SignedOut>
								<SignInButton mode="modal">
									<button className="ml-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-medium hover:from-purple-600 hover:to-pink-700 transition-colors text-sm">
										Sign In
									</button>
								</SignInButton>
							</SignedOut>
							<SignedIn>
								<UserButton
									afterSignOutUrl="/"
									appearance={{
										elements: {
											avatarBox: "w-9 h-9",
											userButtonPopoverCard:
												"bg-gray-900 border border-gray-700",
											userButtonPopoverActionButton: "hover:bg-gray-800",
											userButtonPopoverActionButtonText: "text-white",
											userButtonPopoverFooter: "hidden"
										}
									}}
								/>
							</SignedIn>
						</div>
					</div>

					{/* Mobile menu button */}
					<div className="md:hidden flex items-center gap-3">
						<SignedIn>
							<UserButton
								afterSignOutUrl="/"
								appearance={{
									elements: {
										avatarBox: "w-8 h-8",
										userButtonPopoverCard:
											"bg-gray-900 border border-gray-700",
										userButtonPopoverActionButton: "hover:bg-gray-800",
										userButtonPopoverActionButtonText: "text-white",
										userButtonPopoverFooter: "hidden"
									}
								}}
							/>
						</SignedIn>
						<button
							onClick={() => setIsOpen(!isOpen)}
							className="inline-flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
							aria-label="Toggle menu"
						>
							{!isOpen ? (
								<svg
									className="block h-6 w-6"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
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
				<div className="md:hidden border-t border-gray-800/50">
					<div className="px-4 pt-3 pb-4 space-y-1">
						<Link
							href="/"
							onClick={() => setIsOpen(false)}
							className="text-gray-300 hover:text-white block px-3 py-2.5 rounded-lg text-base font-medium hover:bg-white/5 transition-all"
						>
							Home
						</Link>
						<button
							onClick={() => scrollTo("events")}
							className="text-gray-300 hover:text-white block w-full text-left px-3 py-2.5 rounded-lg text-base font-medium hover:bg-white/5 transition-all"
						>
							Events
						</button>
						<button
							onClick={() => scrollTo("committee")}
							className="text-gray-300 hover:text-white block w-full text-left px-3 py-2.5 rounded-lg text-base font-medium hover:bg-white/5 transition-all"
						>
							Committee
						</button>
						<button
							onClick={() => scrollTo("contact")}
							className="text-gray-300 hover:text-white block w-full text-left px-3 py-2.5 rounded-lg text-base font-medium hover:bg-white/5 transition-all"
						>
							Contact
						</button>
						<SignedOut>
							<div className="pt-2">
								<SignInButton mode="modal">
									<button className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-medium hover:from-purple-600 hover:to-pink-700 transition-colors">
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
