import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { Doc } from "@/convex/_generated/dataModel";
import { convexQuery } from "@/app/utils/convexServer";

/**
 * Creates a Stripe Checkout session for a paid event. Public route —
 * residents don't need an account to pay. The amount always comes from
 * the event document in Convex, never from the client.
 */
export async function POST(request: NextRequest) {
	const stripeKey = process.env.STRIPE_SECRET_KEY;
	if (!stripeKey) {
		console.error("checkout route misconfigured — missing STRIPE_SECRET_KEY");
		return NextResponse.json(
			{ success: false, error: "Online payments are not configured." },
			{ status: 500 }
		);
	}

	try {
		const { eventId } = await request.json();
		if (!eventId || typeof eventId !== "string") {
			return NextResponse.json(
				{ success: false, error: "eventId is required." },
				{ status: 400 }
			);
		}

		const event = await convexQuery<Doc<"events"> | null>("events:getById", {
			id: eventId
		});
		if (!event || !event.isActive) {
			return NextResponse.json(
				{ success: false, error: "Event not found." },
				{ status: 404 }
			);
		}
		if (!event.priceCents || event.priceCents <= 0) {
			return NextResponse.json(
				{ success: false, error: "This event is free — no payment needed." },
				{ status: 400 }
			);
		}

		const eventDate = new Date(`${event.date}T00:00:00`).toLocaleDateString(
			"en-US",
			{ weekday: "long", month: "long", day: "numeric" }
		);

		const origin =
			request.headers.get("origin") ?? request.nextUrl.origin;
		const stripe = new Stripe(stripeKey);
		const session = await stripe.checkout.sessions.create({
			mode: "payment",
			line_items: [
				{
					quantity: 1,
					price_data: {
						currency: "usd",
						unit_amount: event.priceCents,
						product_data: {
							name: event.title,
							description: `${eventDate} at ${event.time} — ${event.location}`
						}
					}
				}
			],
			custom_fields: [
				{
					key: "attendee_name",
					label: { type: "custom", custom: "Your name (for the door list)" },
					type: "text"
				}
			],
			metadata: { eventId },
			success_url: `${origin}/pay/success?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${origin}/#events`
		});

		return NextResponse.json({ success: true, url: session.url });
	} catch (error) {
		console.error("Error creating checkout session:", error);
		return NextResponse.json(
			{ success: false, error: "Could not start the payment. Try again." },
			{ status: 500 }
		);
	}
}
