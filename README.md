# BluffStuff

Community hub for **Woodward Bluffs Mobile Home Park** residents — events, RSVPs, a monthly calendar, anonymous feedback on what worked, and a direct line to the Activities Committee.

**Live:** https://bluffstuff.vercel.app

**Stack:** Next.js 14 (App Router) · Clerk (Google SSO) · Convex (real-time DB + file storage) · Stripe (event payments) · Tailwind (design tokens, light/dark themes) · Framer Motion · nodemailer (Gmail) · OpenAI gpt-image-2 (flyer art)

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
        ├── auto-email of the flyer PNG            (to FLYER_RECIPIENT_EMAIL)
        └── optional AI background art             (gpt-image-2, once per click)
```

### What fires when

| Trigger | What happens |
|---------|--------------|
| Event created via the dashboard form | Saved to Convex → flyer PNG rendered → **auto-emailed** to `FLYER_RECIPIENT_EMAIL` with print instructions. Email failure never blocks creation. |
| Event created via the HTTP API (agent) | Saved to Convex only — **no auto-email**. The agent hands back the flyer link; a committee member clicks "Email to the Printer" on the flyer page. |
| "Generate Background Art" clicked (flyer page, committee-only) | OpenAI `gpt-image-2` paints a light black-and-white photo texture from the event details (~1 min, once per click — not per render) → stored in Convex file storage → composited behind the poster boxes. Click again to reroll. |
| Event archived | Removed from the public calendar/RSVP. **Note:** the flyer PNG still renders for anyone holding the direct `/api/flyer/<id>` URL — archive hides, it does not delete. |
| Archived event deleted | `events:remove` — permanent, and **cascades** to that event's RSVPs, feedback and interest taps. Refuses if the event has `payments` rows, since those are a financial record. Offered in the dashboard on archived events only. |

### Routes

| Route | Access | Purpose |
|-------|--------|---------|
| `/flyer/[eventId]` | Public | Shows the flyer PNG with Print / Download; committee also see "Email to the Printer" and "Generate Background Art" |
| `/api/flyer/[eventId]` | Public | Renders the flyer PNG (edge runtime, `next/og` + satori; Anton/Poppins fonts from `app/fonts/`) |
| `/api/events` | Clerk + committee role | Website create / update / archive / record attendance — injects the write secret server-side |
| `/api/sendFlyer` | Clerk + committee role | Emails the flyer PNG to `FLYER_RECIPIENT_EMAIL` via Gmail |
| `/api/generateFlyerArt` | Clerk + committee role | gpt-image-2 → Convex storage → `event.imageUrl` |
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

- `rsvps:getByEvent` is public but returns **names only** — attendee emails, phones, and notes never leave the server.
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
| `FLYER_RECIPIENT_EMAIL` | Local + Vercel | Who receives new-event flyers (the committee member who prints) |
| `OPENAI_API_KEY` | Local + Vercel | Flyer background art (gpt-image-2) |
| `STRIPE_SECRET_KEY` | Local + Vercel | Event payments (Next.js only; the contextpro.ai account, not LineCrush) |
| `COMMITTEE_API_SECRET` | Local + Vercel + **both Convex deployments** | Gates committee write mutations |
| `CLERK_JWT_ISSUER_DOMAIN` | **Both Convex deployments only** | Clerk instance domain for JWT auth (`convex/auth.config.ts`) |

Convex has **two deployments**: dev (`fantastic-buzzard-256`) and prod (`festive-mink-675`). Test data never touches prod.

## Development

```bash
pnpm dev                # dev server (localhost:3000)
npx convex dev --once   # push convex/ functions to the DEV deployment (run after pulling convex changes)
pnpm lint
pnpm build
```

## Deploying

- **Website:** push to `main` → Vercel auto-deploys. `main` is the only branch; there is no `Production` branch.
- **Convex functions:** NOT deployed by Vercel — run `npx convex deploy` to push `convex/` to prod whenever those files change.
- **Deploy Convex before pushing.** Vercel builds only Next.js, so pushing first leaves the live site calling functions that don't exist yet.

The full runbook — verification steps, how to confirm prod actually works, and the local build/dev gotchas that waste an afternoon — is in `CLAUDE.md` under **Shipping (end to end)**.
