import Link from "next/link";

export default function NotFound() {
	return (
		<div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
			<h1 className="font-display text-6xl font-bold mb-4 text-ink">404</h1>
			<p className="text-xl mb-8 text-ink-muted">
				This page could not be found.
			</p>
			<Link
				href="/"
				className="px-6 py-3 bg-primary hover:bg-primary-strong transition-colors rounded-xl text-primary-fg font-semibold"
			>
				Return Home
			</Link>
		</div>
	);
}
