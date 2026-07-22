# Payments (Stripe)

How residents pay for paid events online, and how the committee confirms payment at the door.

**Live since:** July 2026 · **Processor:** Stripe

---

## The two ways to pay

| Channel | Who runs it | How |
|---------|-------------|-----|
| **Online, ahead of time** | The resident, from the website | "Pay Online" button on the event card → Stripe Checkout → a door-pass confirmation (on screen + emailed) |
| **At the door** | A committee member, on their phone | Stripe Dashboard app + **Tap to Pay** — the phone *is* the card reader; the resident taps their card or phone on the back of it |

Both run through the **same Stripe account**, so every payment — online or at the door — shows up together in the Stripe app and in the account's payout balance.

---

## The Stripe account (read this first)

Payments use Austin's **contextpro.ai** Stripe account (`acct_1HHugpHGDQRligtc`), repurposed for Woodward Bluffs — it was dormant with zero lifetime volume, and a brand-new account couldn't be verified fast enough for the first event.

> ⚠️ **This is NOT the LineCrush account.** The Stripe CLI on Austin's machine is authenticated to a *different* account (`acct_1PqVboRsZ8UQNeKt`, LineCrush). **Never use CLI keys or `stripe` CLI commands for BluffStuff** — always use `STRIPE_SECRET_KEY` from `.env.local` / Vercel, which is the contextpro.ai key named `bluffstuff-website`.

The public business name shown on the Checkout page and card statements is **"Woodward Bluffs Activities Committee"** (Stripe Dashboard → Settings → Business → Public details).

---

## Online payment flow

```
Resident clicks "Pay Online — $8.00" on an event card
        │
        ▼
POST /api/checkout   { eventId }          ← public route
        │  reads event.priceCents from Convex SERVER-SIDE (never trusts the client)
        ▼
Stripe Checkout Session created
        │  • amount = event.priceCents
        │  • custom field "Your name (for the door list)"
        │  • metadata.eventId
        │  • success_url → /pay/success?session_id={CHECKOUT_SESSION_ID}
        ▼
Resident pays on checkout.stripe.com (card, Cash App Pay, Klarna, Link…)
        │
        ▼
/pay/success   (server component, force-dynamic)
        │  1. retrieves the session from Stripe with the secret key
        │  2. confirms payment_status is "paid" (or "no_payment_required" for $0 promos)
        │  3. records it in Convex `payments` (idempotent on session id)
        │  4. emails the door-pass receipt ONCE (only on first record)
        ▼
Door pass rendered on screen  +  matching receipt email
```

### Why each guardrail exists

- **Amount comes from Convex, not the browser.** `/api/checkout` looks the event up server-side and uses `event.priceCents`. A tampered client can't change the price.
- **The success page is the proof.** It re-fetches the session from Stripe with the secret key before showing "You're paid!" — the page can't render a paid state for an unpaid session. That's why showing the screen (or the email) at the door is trustworthy.
- **Recording is idempotent.** `payments:record` is keyed on the Stripe session id (`by_session` index). Refreshing `/pay/success` won't create duplicate records or send duplicate emails — the mutation returns `{ id, alreadyRecorded }`, and the email only fires when `alreadyRecorded` is `false`.
- **The email sends exactly once**, from the committee's existing Gmail (see below).

### The confirmation code

A 6-character code shown on both the door pass and the receipt, derived from the Stripe session id:

```ts
sessionId.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase()
```

It's a human-friendly label for the door — not a secret. The actual proof of payment is the Stripe-verified success page / receipt, not the code itself.

---

## Setting a price on an event

Prices live on the event, so the same event entry drives both the website button and the Stripe amount.

- **Where:** the committee event form (`EventFormModal`) has a **"Price per person ($)"** field. Enter dollars (e.g. `8` or `8.50`); leave **blank for a free event** (no Pay button appears).
- **Stored as:** `events.priceCents` (integer cents; `8` → `800`). `0` / absent = free.
- Dollars→cents conversion happens in the form; `/api/events` re-sanitizes to whole non-negative cents before writing.

To price an existing event directly (e.g. the CLI, for a last-minute event), call the committee-gated `events:update` mutation with `priceCents` — same secret-gated path as any other event write (see the README's *Write security*).

---

## The receipt email

Sent from `/pay/success` immediately after the first successful record.

- **Sends from:** the committee's existing Gmail — the **same `GMAIL_USER` / `GMAIL_APP_PASSWORD`** used for flyer emails (`atmosphere9999@gmail.com`). **No Google Cloud Console, SendGrid, or new credentials needed** — it reuses the flyer email transport (nodemailer + Gmail).
- **From name:** "Woodward Bluffs Activities" (not the raw address).
- **Template:** `app/utils/receiptEmail.ts` — table-based layout with **inline styles only** (no flexbox, no external assets), because Gmail and Yahoo strip modern CSS. Verified to render intact in Gmail.
- **Contents:** the same door pass as the screen — green "✓ PAID" badge, big confirmation code, name / event / when / where / amount, and "Show this email at the door."

---

## Confirming payment at the door

Three ways, any of which is sufficient:

1. **The resident shows the receipt email or the on-screen door pass** — green PAID badge, their name, the code. Because the success page and email are Stripe-verified, this is trustworthy.
2. **The Stripe Dashboard app** on a committee phone lists every payment in real time as it lands.
3. *(Not built yet)* A committee page on the website listing everyone who paid for an event, sorted by name. The backend query for it (`payments:listByEvent`) already exists and is committee-gated; it just needs a dashboard tab.

### Tap to Pay setup (at-door cards)

1. Install the **Stripe Dashboard** app (Google Play) and sign in with the contextpro.ai login.
2. **Payments → +** → **Tap to Pay** → accept the prompts.
3. At the door: type the amount, resident taps card/phone on the back of yours.

> ⚠️ **Gotcha:** Tap to Pay refuses to run while Android **Developer Options** is enabled. Turn Developer Options off (Settings → search "Developer options"), then reopen the Stripe app. You can re-enable it afterward.

---

## Convex `payments` table

| Field | Type | Notes |
|-------|------|-------|
| `eventId` | `id("events")` | Which event was paid for |
| `stripeSessionId` | `string` | Idempotency key |
| `payerName` | `string` | From the "door list" custom field (falls back to Stripe customer name) |
| `payerEmail` | `string` | From Stripe customer details |
| `amountCents` | `number` | What was actually charged |
| `confirmationCode` | `string` | The 6-char door code |
| `createdAt` | `number` | ms timestamp |

**Indexes:** `by_event`, `by_session`.

**Functions** (`convex/payments.ts`):
- `record` (mutation) — committee-secret-gated (shares `requireCommitteeSecret` with `events.ts`), idempotent on `stripeSessionId`, returns `{ id, alreadyRecorded }`. Only the server (`/pay/success`) calls it; the browser never holds the secret.
- `listByEvent` (query) — committee-only via **Clerk↔Convex JWT auth** (`ctx.auth.getUserIdentity()` + role check). Returns `null` for unauthenticated / non-committee callers, so payer names and emails (PII) never leak to the public.

---

## Files

| Purpose | Path |
|---------|------|
| Checkout session creation | `app/api/checkout/route.ts` |
| Door pass + record + email | `app/pay/success/page.tsx` |
| Receipt email template | `app/utils/receiptEmail.ts` |
| Convex payments table/functions | `convex/payments.ts` |
| Price field on event form | `app/components/EventFormModal.tsx` |
| "Pay Online" button | `app/components/EventCard.tsx` |
| Server-safe button styling | `app/components/ui/buttonStyles.ts` |

> `buttonClasses` lives in its own plain module (`buttonStyles.ts`) rather than in `Button.tsx`. `Button.tsx` is a `"use client"` module, and functions exported from a client module become client references that **can't be called in a server component** — the `/pay/success` server page needs `buttonClasses`, so it imports from `buttonStyles.ts`. `Button.tsx` re-exports it for existing client callers.

---

## Environment

| Variable | Where | Purpose |
|----------|-------|---------|
| `STRIPE_SECRET_KEY` | Local + Vercel | Next.js only — Convex never talks to Stripe. The contextpro.ai key `bluffstuff-website`. |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | Local + Vercel | Receipt email (shared with flyer email) |

Public routes (in `middleware.ts`): `/pay/*` and `/api/checkout` are public — residents pay without an account.

---

## Testing the full pipeline for free

You can exercise checkout → door pass → record → email end-to-end **without a real charge**, using a 100%-off Stripe coupon:

1. Create a one-time coupon: `POST /v1/coupons` with `percent_off=100`, `duration=once`.
2. Create a Checkout session with `discounts[0][coupon]=<id>` (mirror the fields `/api/checkout` sets — `metadata.eventId`, the name custom field, `success_url`).
3. Complete it in the browser (a $0 session asks only for email + the name field, no card).
4. Verify: the door pass renders, a `payments` row exists, and the receipt lands in Gmail.
5. **Delete the coupon** (`DELETE /v1/coupons/<id>`) so it can't be reused.

A $0 session completes with `payment_status = "no_payment_required"` (not `"paid"`) — the success page accepts both, which is also what makes future genuinely-free-but-priced promos work.
