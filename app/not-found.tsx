import Link from "next/link";
import { buttonClasses } from "./components/ui/buttonStyles";

// Most people who land here typed or tapped an old link. "404" means nothing
// to them; say what happened and give them the one place they likely wanted.
export default function NotFound() {
	return (
		<div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center">
			<div className="max-w-xl">
				<h1 className="font-display text-3xl font-bold text-ink mb-3">
					We couldn&apos;t find that page
				</h1>
				<p className="text-ink-muted text-lg mb-8">
					The link may be old or have a typo. Everything coming up at the
					park is on the events list.
				</p>
				<Link href="/#events" className={buttonClasses("primary", "lg")}>
					See upcoming events
				</Link>
			</div>
		</div>
	);
}
