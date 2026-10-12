# BluffStuff

Community hub for **Woodward Bluffs Mobile Home Park** residents — events, RSVPs, a monthly calendar, anonymous feedback on what worked, and a direct line to the Activities Committee.

**Live:** https://bluffstuff.vercel.app

**Stack:** Next.js 14 (App Router) · Clerk (Google SSO) · Convex (real-time DB + file storage) · Stripe (event payments) · Tailwind (design tokens, light/dark themes) · Framer Motion · nodemailer (Gmail) · OpenAI gpt-image-2.5-sunburst (flyer design) + gpt-5.4-mini (flyer proofreading)

---

## Residents never need an account

Most residents are older and almost all of them use the site on a phone (Android or iPhone). Everything a resident can do works signed out: reading events, RSVPing, paying, interest taps, ideas, feedback and the contact form. Accounts work the same as before: the committee signs in for the dashboard, and a resident *may* sign in to keep display settings on all their devices, but nothing asks them to.

- **Sign In is there, never required.** The navbar has an outlined Sign In button (desktop bar and phone menu) for the committee and for any resident who wants an account; the display settings panel has an optional "Sign in" line too. Nothing on the site asks a resident to use it.
- **Every event has its own page**, `/events/[eventId]` (public). Flyer QR codes open it, the Share button sends it, and the calendar links to it. Texting the link previews the flyer. Past events point to their feedback form; archived or bad links get a friendly page, never an error.
- **RSVP is a name and a headcount.** Email and phone are optional (an email gets the day-before reminder). The phone remembers the resident (`bs-contact` in localStorage) and recognizes its own RSVP through the anonymous `visitorId`, so the same phone can change the headcount or tap "I can't make it". The "going" counts are headcounts (party sizes summed), not RSVP rows.
- **Display settings ("Aa" in the navbar):** text size (Normal / Large / Extra large) and light/dark. Saved on the device (`bs-text-size`, `bs-theme`) and applied before first paint. For signed-in people they're also stored on their `users` row (`users:getMyPreferences/setMyPreferences`, keyed on the Clerk JWT only) and follow them across devices: the account wins on sign-in, and an account with nothing saved adopts the device's settings.
- **Contact form:** email *or* phone, at least one.

---

## The Event → Flyer Pipeline

The core idea: **an event is entered once, and everything else is generated from it.**

```
committee enters event (website form or trusted agent)
        │
        ▼
   Convex `events` table  ←──────────── single source of truth
        │
        ├── website calendar + event cards + RSVP  (instant, real-time)
        ├── print-ready flyer PNG with QR code     (/api/flyer/[eventId])
        ├── flyer page with Print / Download       (/flyer/[eventId])
        ├── AI flyer design, proofread             (gpt-image-2.5-sunburst, on create)
        └── auto-email of the flyer PNG            (to FLYER_RECIPIENT_EMAIL)
```

### Flyer anatomy (US Letter, 1275×1650 PNG)

Every flyer has two parts, and only the top one ever changes:

- **Top (1275×1200): the event design.** `gpt-image-2.5-sunburst` paints a festive poster with the event's exact text in one fixed house style (cream background, thick outlines, deep green / tomato red / orange / gold, dark lettering so it survives black-and-white printing). `gpt-5.4-mini` then proofreads the painted text against the event fields; a miss gets one re-roll, and a second miss saves nothing, so a misspelled poster never reaches the printer. Until a poster exists (or if it failed), a code-drawn layout fills this space. About 7¢ per poster, about 40 seconds.
- **Bottom (1275×450): the "how to use the website" panel.** Always drawn in code, never by the AI (an AI-drawn QR doesn't scan): a ~2.6-inch QR code (error-correction Q, full quiet zone) to **that event's own page** (`/events/<id>`), three numbered plain-English steps for residents who've never scanned a code, the address typed out for anyone without a camera, and the benefits line. The layout is identical on every flyer; only the QR target differs. Because the panel is drawn on every render, changing it updates existing flyers without redesigning their posters. Echo's `bluff_event.py verify` decodes the QR and expects exactly `https://bluffstuff.vercel.app/events/<id>`.

The poster's file type is the flag: posters are stored as **JPEG**, older gpt-image-2 background art as **PNG**, and `flyer.tsx` reads the stored `Content-Type` to choose the layout, so no Convex schema change was needed. Editing an event's text, date, time, place or price through the website clears the poster (`imageUrl: ""`), because the old details are painted into it, and starts a redesign.

### What fires when

| Trigger | What happens |
|---------|--------------|
| Event created via the dashboard form | Saved to Convex → `/api/generateFlyerArt` with `emailPrinter: true` designs and proofreads the AI poster (~1 min) → flyer PNG **auto-emailed** to `FLYER_RECIPIENT_EMAIL`. If the design fails, the code-drawn flyer is emailed instead. Neither blocks creation. |
| Event edited via the dashboard form | If the text, date, time, place or price changed, the old poster is cleared and a new one is designed (no email). |
| Event created via the HTTP API (agent) | Saved to Convex only. The agent then calls `/api/generateFlyerArt` with the `x-committee-secret` header (see Routes) to design the poster, verifies the PNG, and hands back the flyer link; "Email to the Printer" stays a committee click. |
| "Design Flyer with AI" / "Redesign Flyer" clicked (flyer page, committee-only) | Same design + proofread as above, once per click. Click again to reroll. |
| Event archived | Removed from the public calendar/RSVP. **Note:** the flyer PNG still renders for anyone holding the direct `/api/flyer/<id>` URL — archive hides, it does not delete. |
| Archived event deleted | `events:remove` — permanent, and **cascades** to that event's RSVPs, feedback and interest taps. Refuses if the event has `payments` rows, since those are a financial record. Offered in the dashboard on archived events only. |

### Routes

| Route | Access | Purpose |
|-------|--------|---------|
| `/events/[eventId]` | **Public, no sign-in** | One event, phone-first: details, RSVP, pay, share. Where flyer QR codes land. Server-rendered (`convexQuery`), OG image = the flyer PNG |
| `/flyer/[eventId]` | Public | Shows the flyer PNG with Print / Download; committee also see "Email to the Printer" and "Design Flyer with AI" |
| `/api/flyer/[eventId]` | Public | Renders the flyer PNG (edge runtime, `next/og` + satori; Anton/Poppins fonts from `app/fonts/`) |
| `/api/events` | Clerk + committee role | Website create / update / archive / record attendance — injects the write secret server-side |
| `/api/sendFlyer` | Clerk + committee role | Emails the flyer PNG to `FLYER_RECIPIENT_EMAIL` via Gmail |
| `/api/sendReminders` | `CRON_SECRET` bearer | Vercel Cron, daily 9am Pacific - emails everyone who RSVP'd *and left an email* (it's optional): a reminder for tomorrow's events (links the event page to change or cancel) and a thank-you with the feedback link for yesterday's. Idempotent via `events.reminderSentAt` / `events.thankYouSentAt`; returns 500 and leaves an event unmarked if every send for it failed |
| `/api/generateFlyerArt` | Clerk + committee role, **or** header `x-committee-secret: <COMMITTEE_API_SECRET>` plus a committee `requesterEmail` in the body (agents). Public in middleware, so the route does its own auth | Body `{ eventId, emailPrinter?, requesterEmail? }`. Sunburst poster → proofread → Convex storage (JPEG) → `event.imageUrl`. Returns `{ success, attempts, emailed }`; 502 if the poster failed |
| `/feedback/[eventId]` | **Public, no sign-in** | Post-event feedback — see [The Feedback Loop](#the-feedback-loop) |
| `/admin` | Clerk + committee role | Committee dashboard (events, turnout, ideas, messages) |
| `/admin/seed` | Clerk | One-off bootstrap that grants the committee role |

### Write security

Committee write mutations (`events:create/update/archive/remove/setAttendance`, `events:generateUploadUrl`, `events:setEventImage`) require a `secret` argument matching **`COMMITTEE_API_SECRET`** — set per Convex deployment with `npx convex env set COMMITTEE_API_SECRET <value> [--prod]`. Email fields on those mutations are attribution only, not auth.

- **Browsers never hold the secret.** The website writes through `/api/events`, which authenticates with Clerk, checks the committee role, and adds the secret server-side.
- **Trusted agents** (e.g. Echo) call the Convex HTTP API directly and include the secret in `args`:

```
POST https://<convex-deployment>.convex.cloud/api/mutation
{"path":"events:create","args":{"title":"...","description":"...","date":"YYYY-MM-DD","time":"3:00 PM","location":"...","createdBy":"<committee email>","secret":"<COMMITTEE_API_SECRET>"},"format":"json"}
```

Agent tip: post the JSON from a UTF-8 file rather than inline shell strings — em-dashes/smart quotes mangle through bash and return `BadJsonBody`.

**Two different committee gates — don't confuse them.** Event writes use the shared secret above, because trusted agents need a way in without a browser session. The newer moderation mutations (`contactMessages:setRead/remove`, `ideas:setHidden/remove`, `feedback:remove`) instead gate on **Clerk JWT identity** via `convex/committeeAuth.ts`, and have no secret argument — they are dashboard-only and an agent cannot call them. `events:setAttendance` is secret-gated like the rest of `events:*`.

### Read security

- `rsvps:getByEvent` is public but returns **names and party sizes only** - attendee emails, phones, and notes never leave the server. `rsvps:myRsvp` returns a row only to the browser holding its `visitorId`. The full guest list with contact details is `rsvps:listForCommittee` (Clerk JWT, committee only; the dashboard's **Guests** button).
- `ideas:list` is public and builds its payload **field by field** so the submitter's anonymous `visitorId` never ships to the client. Anything new that reads `eventIdeas`, `eventFeedback`, or `eventInterest` must do the same — spreading the document leaks it and de-anonymizes the board.
- `feedback:listAll` and `ideas:listForCommittee` are committee-gated and return `[]` to everyone else. `feedback:getCountByEvent` is public but count-only.
- `contactMessages:list` authenticates via **Clerk↔Convex JWT auth**: the browser's Clerk session token (JWT template named `convex`, created via Clerk's Backend API) flows through `ConvexProviderWithClerk`, and the query checks `ctx.auth.getUserIdentity()` + committee role server-side. Unauthenticated or non-committee callers get `[]`.
- The Clerk issuer domain lives in `CLERK_JWT_ISSUER_DOMAIN` on each Convex deployment (see `convex/auth.config.ts`).

---

## The Feedback Loop

The pipeline above gets an event *out*. This gets the answer *back* — specifically, why an event was empty, which is a question the site previously had no way to ask.

The design constraint that shapes everything here: **the people worth hearing from are the ones who did not attend**, and they will not create an account to explain why. So all three signals are anonymous and login-free, and `/feedback/*` is a public route.

| Signal | Where | What it answers |
|--------|-------|-----------------|
| Post-event feedback | `/feedback/[eventId]` | Opens with "did you make it?" — the **No** branch (checkbox reasons) is the substantial one |
| Interest tap | "I'd come to this" on event cards | Is there demand, *before* the supplies get bought |
| Idea board | `#ideas` on the home page | What residents actually want, ranked by one-tap upvotes |

Residents reach the feedback page from a "How Did We Do?" section on the home page, or from the flyer page once the event date has passed — which turns the QR **already printed on the posters** into the feedback path, with no change to the flyer art.

The committee reads it at `/admin` → **Turnout & Feedback**, which pairs interest taps, RSVPs and a committee-entered headcount on one row. That headcount is the point: without it, *"nobody wanted it"* and *"everyone said yes then stayed home"* look identical and need opposite fixes.

Anonymity is enforced server-side. A random browser-local `visitorId` (`app/hooks/useVisitorId.ts`) dedupes taps and votes; it never leaves the server, and it is not an identity — two devices count twice, and clearing site data resets it. That looseness is the trade: a sign-in wall would cost exactly the responses we need.

Tables: `eventFeedback`, `eventInterest`, `eventIdeas`, `ideaVotes`, plus `events.attendanceCount`. Reason keys live in `convex/feedbackOptions.ts` and are shared by the form, the Convex validator and the dashboard tally — change a label freely, never repurpose a key.

Full constraints and the admin dashboard's structure: **`CLAUDE.md`** → *Feedback, Interest & Ideas* and *Admin Dashboard*.

---

## Payments

Events can carry a price (`events.priceCents`); priced events get a **"Pay Online"** button that runs Stripe Checkout, and the resident receives a **door-pass confirmation** on screen and by email to show at the door. Committee members also take cards at the door via **Stripe Tap to Pay** on their phone. Both channels use the same Stripe account.

Two things not to relearn:

- **Stripe account:** the **contextpro.ai** account (`acct_1HHugpHGDQRligtc`), *not* the LineCrush account the local Stripe CLI is authenticated to. Never use CLI keys for BluffStuff — use `STRIPE_SECRET_KEY` (the `bluffstuff-website` key).
- **The receipt email reuses the flyer Gmail transport** (`GMAIL_USER` / `GMAIL_APP_PASSWORD`) — no separate email provider.

Full flow, security guardrails, the `payments` table, at-door setup, and how to test for free: **[`Docs/payments.md`](Docs/payments.md)**.

---

## Environment variables

Never hardcode any of these. Local values live in `.env.local`.

| Variable | Where it's needed | Purpose |
|----------|-------------------|---------|
| Clerk keys | Local + Vercel | Auth (`@clerk/nextjs`) |
| `CONVEX_DEPLOYMENT` | Local | Which Convex deployment the CLI targets (dev) |
| `NEXT_PUBLIC_CONVEX_URL` | Local + Vercel | Convex client URL |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | Local + Vercel | Flyer + reminder + payment-receipt emails |
| `MAIL_FROM_ADDRESS` | Optional, Vercel | Visible sender if it should differ from `GMAIL_USER`. **Requires a verified Gmail alias first** — see below |
| `FLYER_RECIPIENT_EMAIL` | Local + Vercel | Who receives new-event flyers (the committee member who prints) |
| `OPENAI_API_KEY` | Local + Vercel | Flyer design (gpt-image-2.5-sunburst) and proofreading (gpt-5.4-mini) |
| `STRIPE_SECRET_KEY` | Local + Vercel | Event payments (Next.js only; the contextpro.ai account, not LineCrush) |
| `COMMITTEE_API_SECRET` | Local + Vercel + **both Convex deployments** | Gates committee write mutations |
| `CRON_SECRET` | Local + Vercel (Production) | Bearer token Vercel Cron sends to `/api/sendReminders`; it is that route's only auth |
| `CLERK_JWT_ISSUER_DOMAIN` | **Both Convex deployments only** | Clerk instance domain for JWT auth (`convex/auth.config.ts`) |

Convex has **two deployments**: dev (`fantastic-buzzard-256`) and prod (`festive-mink-675`). Test data never touches prod.

### Who the site emails as

Every outgoing email — flyers, reminders, payment receipts — is sent through the single Gmail account in `GMAIL_USER`, using an app password. All three go out as **"Woodward Bluffs Activities"** via `mailFrom()` in `app/config/site.ts`; never set a `from:` by hand.

**Gmail rewrites the `From:` header** back to the authenticated account unless the address is a verified *Send mail as* identity on that account. So `MAIL_FROM_ADDRESS` alone changes nothing — the alias has to exist first. To move the site off a personal address:

1. Gmail → Settings → **Accounts and Import** → *Send mail as* → **Add another email address**
2. Enter the committee address and the display name, complete the emailed verification
3. Set `MAIL_FROM_ADDRESS` to it on Vercel (`vercel env add MAIL_FROM_ADDRESS production`) and redeploy

Until then the site sends as `GMAIL_USER`, which is the intended fallback. Practical limits worth knowing: Gmail caps sending at roughly **500 recipients/day**, everything depends on that one account's password, and replies land wherever the sender address points.

## Development

Package manager is **Bun** (`bun.lock`). Vercel detects the lockfile and installs with Bun too.

```bash
bun install             # dependencies
bun run dev             # dev server (localhost:3000)
bunx convex dev --once  # push convex/ functions to the DEV deployment (run after pulling convex changes)
bun run lint
bun run build
```

## Deploying

- **Website:** push to `main` → Vercel auto-deploys. `main` is the only branch; there is no `Production` branch.
- **Convex functions:** NOT deployed by Vercel — run `npx convex deploy` to push `convex/` to prod whenever those files change.
- **Deploy Convex before pushing.** Vercel builds only Next.js, so pushing first leaves the live site calling functions that don't exist yet.

The full runbook — verification steps, how to confirm prod actually works, and the local build/dev gotchas that waste an afternoon — is in `CLAUDE.md` under **Shipping (end to end)**.
