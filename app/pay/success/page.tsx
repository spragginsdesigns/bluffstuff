import Link from "next/link";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { convexQuery } from "@/app/utils/convexServer";
import { buttonClasses } from "@/app/components/ui/buttonStyles";

export const dynamic = "force-dynamic";

/**
 * Door pass shown after a successful Stripe Checkout payment. The
 * session is verified server-side with the secret key, so this page
 * rendering "Paid" is itself proof of payment — residents show it
 * (or the emailed receipt) to the committee at the door.
 */

function ErrorCard({ message }: { message: string }) {
	return (
		<main className="min-h-screen bg-bg flex items-center justify-center px-4 py-12">
			<div className="max-w-md w-full bg-surface border border-border rounded-2xl shadow-card p-8 text-center">
				<h1 className="font-display text-2xl font-bold text-ink mb-3">
					Payment not confirmed
				</h1>
				<p className="text-ink-muted mb-6">{message}</p>
				<Link href="/#events" className={buttonClasses("primary")}>
					Back to events
				</Link>
			</div>
		</main>
	);
}

export default async function PaymentSuccessPage({
	searchParams
}: {
	searchParams: { session_id?: string };
}) {
	const sessionId = searchParams.session_id;
	const stripeKey = process.env.STRIPE_SECRET_KEY;
	if (!sessionId || !stripeKey) {
		return (
			<ErrorCard message="We couldn't find this payment. If you were charged, your emailed Stripe receipt works as proof at the door." />
		);
	}

	let session: Stripe.Checkout.Session;
	try {
		const stripe = new Stripe(stripeKey);
		session = await stripe.checkout.sessions.retrieve(sessionId);
	} catch (error) {
		console.error("Error retrieving checkout session:", error);
		return (
			<ErrorCard message="We couldn't look up this payment. If you were charged, your emailed Stripe receipt works as proof at the door." />
		);
	}

	// "no_payment_required" = a 100%-off promo brought the total to $0
	const isPaid =
		session.payment_status === "paid" ||
		session.payment_status === "no_payment_required";
	if (!isPaid) {
		return (
			<ErrorCard message="This payment hasn't gone through yet. Please try again from the event page." />
		);
	}

	const payerName =
		session.custom_fields.find((f) => f.key === "attendee_name")?.text
			?.value ??
		session.customer_details?.name ??
		"Guest";
	const payerEmail = session.customer_details?.email ?? "";
	const amountCents = session.amount_total ?? 0;
	const confirmationCode = sessionId
		.replace(/[^a-zA-Z0-9]/g, "")
		.slice(-6)
		.toUpperCase();

	const eventId = session.metadata?.eventId as Id<"events"> | undefined;
	let event: Doc<"events"> | null = null;
	if (eventId) {
		try {
			event = await convexQuery<Doc<"events"> | null>("events:getById", {
				id: eventId
			});
		} catch (error) {
			console.error("Error loading event for confirmation:", error);
		}

		// Record the payment so the committee can see who paid; never
		// block the resident's confirmation screen on it.
		const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
		const secret = process.env.COMMITTEE_API_SECRET;
		if (convexUrl && secret) {
			try {
				const convex = new ConvexHttpClient(convexUrl);
				await convex.mutation(api.payments.record, {
					eventId,
					stripeSessionId: sessionId,
					payerName,
					payerEmail,
					amountCents,
					confirmationCode,
					secret
				});
			} catch (error) {
				console.error("Error recording payment in Convex:", error);
			}
		}
	}

	const amount = (amountCents / 100).toLocaleString("en-US", {
		style: "currency",
		currency: "usd"
	});
	const eventDate = event
		? new Date(`${event.date}T00:00:00`).toLocaleDateString("en-US", {
				weekday: "long",
				month: "long",
				day: "numeric"
			})
		: null;

	return (
		<main className="min-h-screen bg-bg flex items-center justify-center px-4 py-12">
			<div className="max-w-md w-full bg-surface border border-border rounded-2xl shadow-lifted overflow-hidden">
				<div className="bg-accent-soft px-8 pt-8 pb-6 text-center">
					<div className="mx-auto w-16 h-16 rounded-full bg-accent flex items-center justify-center mb-4">
						<svg
							className="w-9 h-9 text-accent-fg"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={3}
								d="M5 13l4 4L19 7"
							/>
						</svg>
					</div>
					<h1 className="font-display text-3xl font-bold text-ink">
						You&apos;re paid!
					</h1>
					<p className="text-ink-muted mt-1">
						Show this screen at the door
					</p>
				</div>

				<div className="px-8 py-6 space-y-4">
					<div className="text-center">
						<div className="text-sm text-ink-muted uppercase tracking-wide font-semibold mb-1">
							Confirmation code
						</div>
						<div className="font-mono text-4xl font-bold text-primary tracking-[0.2em]">
							{confirmationCode}
						</div>
					</div>

					<div className="border-t border-border pt-4 space-y-2 text-base">
						<div className="flex justify-between gap-4">
							<span className="text-ink-muted">Name</span>
							<span className="text-ink font-semibold text-right">
								{payerName}
							</span>
						</div>
						{event && (
							<div className="flex justify-between gap-4">
								<span className="text-ink-muted">Event</span>
								<span className="text-ink font-semibold text-right">
									{event.title}
								</span>
							</div>
						)}
						{eventDate && event && (
							<div className="flex justify-between gap-4">
								<span className="text-ink-muted">When</span>
								<span className="text-ink font-semibold text-right">
									{`${eventDate} at ${event.time}`}
								</span>
							</div>
						)}
						<div className="flex justify-between gap-4">
							<span className="text-ink-muted">Paid</span>
							<span className="text-accent-strong font-bold text-right">
								{amount}
							</span>
						</div>
					</div>

					{payerEmail && (
						<p className="text-sm text-ink-muted text-center">
							A receipt was emailed to {payerEmail} — that works at the
							door too.
						</p>
					)}

					<div className="pt-2 text-center">
						<Link href="/#events" className={buttonClasses("outline")}>
							Back to events
						</Link>
					</div>
				</div>
			</div>
		</main>
	);
}
