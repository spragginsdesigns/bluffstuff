# Project: BluffStuff (Woodward Bluffs Activities Committee)

@~/.claude/CLAUDE.md

---

## Project Vision

A community hub for Woodward Bluffs Mobile Home Park residents to:
- **Discover events** - Beautiful, easy-to-read monthly activity calendar
- **RSVP to events** - Simple registration for community activities
- **Submit feedback** - Give input to the activities committee
- **Stay informed** - See what's happening in the park each month

The site should feel welcoming, accessible to all ages, and dead simple to use.

---

## Project Context

**Stack:** Next.js 14 (App Router) + Clerk Auth + Convex (real-time DB) + Tailwind CSS (design tokens, hand-rolled UI primitives) + Framer Motion
**Repo:** https://github.com/spragginsdesigns/bluffstuff
**Deployed:** https://bluffstuff.vercel.app/
**Year:** 2026

## Terminology

| Term | Meaning | Location |
|------|---------|----------|
| BluffStuff | Woodward Bluffs Mobile Home Park Activities Committee website | Root |
| Committee | Admin users who manage events (role: "committee") | `convex/schema.ts` |
| Resident | Regular community members (role: "resident") | `convex/schema.ts` |
| RSVP | Event attendance registration (stored in Convex) | `convex/rsvps.ts` |
| Attendee | Person registered for an event | `types/Event.ts` |
| UserSync | Auto-syncs Clerk auth users to Convex database on sign-in | `app/components/UserSync.tsx` |
| Seed | Admin-only page to initialize/upgrade committee role | `app/admin/seed/page.tsx` |

## Project Structure

```
bluffstuff/
├── app/                    # Next.js App Router pages & components
│   ├── api/                # API routes (rsvp, sendReminders)
│   ├── components/         # React components
│   │   ├── NavBar.tsx      # Top navigation with scroll-to-section links
│   │   ├── Hero.tsx        # Landing hero section
│   │   ├── EventCard.tsx   # Event display card (accepts ConvexEvent)
│   │   ├── EventFormModal.tsx  # Committee event creation/edit form
│   │   ├── MonthlyCalendar.tsx # Monthly calendar with event indicators
│   │   ├── RsvpModal.tsx   # RSVP form (Convex-backed, auto-fills from Clerk)
│   │   ├── AttendeesList.tsx   # Real-time attendee list per event
│   │   ├── Committee*Tab.tsx    # Admin dashboard tabs (rendered by /admin)
│   │   ├── ContactForm.tsx # Contact form (Convex-backed)
│   │   ├── UserSync.tsx    # Clerk → Convex user sync (runs in layout)
│   │   ├── FAQ.tsx         # Community FAQ
│   │   ├── Footer.tsx      # Site footer
│   │   └── Amenities.tsx   # Park amenities section
│   ├── hooks/
│   │   └── useIsCommittee.ts  # Role check hook (Clerk + Convex)
│   ├── providers/          # ConvexClientProvider, Clerk provider
│   ├── utils/calendar.ts   # Calendar date utilities
│   ├── sign-in/            # Clerk sign-in page
│   ├── sign-up/            # Clerk sign-up page
│   ├── admin/seed/         # Admin seed page (committee role initialization)
│   ├── layout.tsx          # Root layout (Convex + Clerk + Theme + UserSync)
│   └── page.tsx            # Home page (single-page with scroll sections)
├── convex/                 # Convex backend
│   ├── schema.ts           # Database schema (users, events, rsvps, contactMessages)
│   ├── users.ts            # User queries + upsert mutation (role is server-side only)
│   ├── events.ts           # Event CRUD (committee-only writes)
│   ├── rsvps.ts            # RSVP queries + mutations
│   ├── contactMessages.ts  # Contact form storage + committee-only list
│   └── seed.ts             # Admin role initialization mutation
├── public/                 # Static assets (logo, favicons)
├── types/Event.ts          # ConvexEvent, ConvexRsvp, legacy types
├── middleware.ts           # Clerk auth middleware
├── tailwind.config.ts      # Tailwind configuration
└── next.config.mjs         # Next.js config
```

## Development Commands

```bash
# Start dev server (Claude should NOT run this - assume it's running)
pnpm dev

# Lint
pnpm lint

# Build
pnpm build

# Start production
pnpm start
```

**Two local gotchas that cost real time — read before running any of the above:**

- **Never run a build while the dev server is running.** `next dev` and `next build` share `.next/`, and the build clobbers the dev server's chunks. The symptom is confusing: the dev server keeps returning 200 for pages but 404s its own `main-app.js` / `app-pages-internals.js`, so every page hangs on a loading spinner with a clean console. Fix: stop dev, `rm -rf .next`, restart. Stop the dev server *first* if you need to build.
- **`pnpm --ignore-workspace <script>` wants to purge `node_modules`.** The flag changes pnpm's config hash, so it tries a reinstall and aborts with `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`. Don't force it. Invoke the tool directly instead — `npx next dev`, `npx next build`, `npx tsc --noEmit` — which is exactly what the package scripts run.

---

## Shipping (end to end)

`main` is the only branch. **There is no `Production` branch here** — the global `git push origin main:Production` rule is LineCrush-specific, do not apply it to this repo. Vercel auto-deploys from `main`.

**Order matters: Convex before Git.** Vercel builds only Next.js, so pushing first leaves the live frontend calling functions that don't exist yet.

```bash
# 1. Verify. Dev server must be STOPPED for the build (see gotcha above).
npx tsc --noEmit
npx next build

# 2. Convex to prod FIRST — required whenever anything in convex/ changed
npx convex deploy -y          # -> festive-mink-675 (prod)

# 3. Then commit + push. Stage only files you touched; never `git add -A`.
git add <specific files>
git commit -m "type(scope): ..."
git push origin main          # Vercel picks it up
```

**Verify prod afterwards — deploying is not the same as working.** Convex has no admin UI check from the CLI, so query the deployment directly:

```bash
# any public query; `status: success` means the function is live
curl -s https://festive-mink-675.convex.cloud/api/query \
  -H 'Content-Type: application/json' \
  -d '{"path":"ideas:list","args":{},"format":"json"}'
```

Then open the live site in a **browser**, not curl. Most sections are client components whose Convex queries are unresolved during SSR, so they render `null` and are genuinely absent from the fetched HTML even when they work perfectly. Grepping the HTML for them produces false alarms.

**Gates that are easy to miss:**
- Anything in `convex/` changed → `npx convex deploy` is mandatory, and a new env var must be set on **both** deployments (`npx convex env set NAME value` and again with `--prod`) plus Vercel.
- Schema changes are validated against live prod data on deploy. Adding a **required** field to an existing table will fail the push — add it as `v.optional()` (see `events.attendanceCount`, `contactMessages.isRead`).
- Committee-gated behaviour can't be verified while signed out; both the queries and the `/admin` page will look empty and that is correct. Don't chase it.

---

## Coding Standards

### Core Philosophy

- **Surgical changes over rewrites** - Mature systems require precision, not sweeping refactors
- **Assume existing behavior is correct** - Stability first; change only with proof
- **Smallest safe fix** - Minimizes unintended side effects
- **History is king** - Most production bugs trace back to recent changes
- **Show results, hide methods** - Surface value clearly; protect implementation details

### Architecture

- **One clear job per module/component** - If it can't be described in one sentence, split it
- **Co-locate by feature** - Group hooks, utils, types, and components by domain
- **Pure logic -> utils; stateful -> hooks/services; UI -> components**
- **Extract at 200+ lines** - Maintain readability and modularity
- Refactor when code mixes UI/state/side effects, requires heavy mocking, imports from many unrelated domains, or has excessive boolean flags

### Code Reuse (30-Second Rule)

Before writing ANY new code: search for existing implementations first. Red flags: duplicating shared components, rewriting utilities, copy-pasting across files, duplicating type definitions.

### Naming Conventions

| Type | Convention |
|------|-----------|
| React Component | PascalCase |
| Hook | camelCase prefixed with `use` |
| TS Utility | camelCase |
| Types | descriptive + `.types.ts` |
| Test | source name + `.test` |
| Variables/functions | camelCase |
| Constants | SCREAMING_SNAKE |
| Booleans | prefixed with `is`, `has`, `can` |

**Import order:** External libraries -> Internal absolute -> Relative -> Type-only. Prefer named exports over defaults unless framework requires otherwise.

### TypeScript

- Strict mode: `strict`, `noImplicitAny`, `strictNullChecks`
- Prefer `unknown` over `any` - narrow with type guards
- Type all params and return values
- Use `?.` and `??` for nullables, avoid `!` unless provably safe
- Validate external data with schema validation
- No `@ts-ignore` without documented justification

### Styling

- Themed design tokens ONLY — never hardcode colors; use `bg-bg`/`bg-surface`/`text-ink`/`text-ink-muted`/`bg-primary`/`bg-accent` etc. (defined in `app/globals.css`, mapped in `tailwind.config.ts`)
- Light + dark themes via `.dark` class on `<html>`; toggle in `app/components/theme/`
- Accessible color contrast
- Consistent spacing and typography scale
- Reusable card components
- Accessible focus states
- No excessive visual noise

### Root Cause Discipline

Never stop at the first symptom. Always ask: "Where did this data originate?"

Investigation flow: recent history -> trace reads/writes -> database state -> job timing -> fix upstream cause.

### Verification

Never assume changes work. After ANY change:

| Change Type | Verification |
|------------|-------------|
| Schema changes | Validate structure and sample data |
| TypeScript changes | Run type checks |
| Bug fixes | Reproduce original issue |
| API changes | Test endpoints directly |
| UI changes | Validate console, network, responsiveness |

### Anti-Patterns to Avoid

- Utility dumping grounds -> split by domain
- God components -> compose smaller pieces
- Deep prop drilling -> use context or composition
- Boolean flag explosion -> use variants or config objects
- Dead code -> delete immediately
- Over-commenting -> explain *why*, not *what*
- Debug logging left in -> remove before commit

---

## Project-Specific Rules

### Auth & Data Flow
- **Auth:** Clerk (`@clerk/nextjs`) — Google SSO sign-in, hooks: `useUser`, `SignInButton`, etc.
- **Database:** Convex for ALL data (users, events, RSVPs, contact messages) — no Vercel Postgres
- **User sync:** `UserSync` component in root layout auto-creates/updates Convex user records on Clerk sign-in
- **Role management:** Server-side only — `upsertUser` never accepts `role` from client; new users default to "resident"
- **Committee access:** Use `useIsCommittee()` hook (checks Clerk user email against Convex role)
- **Admin bootstrap:** Visit `/admin/seed` to initialize admin with "committee" role (hardcoded to `atmosphere9999@gmail.com`)

### UI & Styling
- UI: Tailwind CSS + hand-rolled primitives in `app/components/ui/` (Button, Input, Textarea, Field, Modal, Section) + Framer Motion animations
- **Theme system:** warm light mode (cream/terracotta/sage) is default; warm charcoal dark mode via `.dark` class. Tokens live in `app/globals.css` (CSS vars) → `tailwind.config.ts`. No-flash inline script in `layout.tsx`; `ThemeProvider`/`ThemeToggle` in `app/components/theme/`; Clerk follows theme via `app/lib/clerkAppearance.ts`
- Fonts: Fraunces (display, `font-display`) + Atkinson Hyperlegible (body) via next/font — flyer keeps its own local Anton/Poppins
- Modals: ALWAYS use `ui/Modal` (native `<dialog>` — focus containment, Escape, backdrop-click, single body-scroll-lock)
- Navigation links: single source in `app/config/nav.ts` + `app/utils/scroll.ts` (NavBar, MobileTabBar, Footer all consume it)
- Committee roster: single source in `app/data/committee.ts`
- Mobile-first responsive: all components must work beautifully on phones
- Big readable type (17px base) + WCAG AA contrast — audience includes older adults
- Single-page layout with smooth scroll-to-section navigation

### Routes & Middleware
- Public routes: `/`, `/qr`, `/flyer/*`, `/api/flyer/*`, `/pay/*`, `/api/checkout`, `/sign-in`, `/sign-up` (see `middleware.ts`)
- All other routes require Clerk authentication
- Home page uses anchor sections: `#events`, `#calendar`, `#committee`, `#resources`, `#faq`, `#contact`

### Event → Flyer Pipeline (see README for the full picture)
One event entry fans out to: website calendar/RSVP, print-ready flyer PNG with QR (`/api/flyer/[eventId]`), flyer page (`/flyer/[eventId]`), auto-email to `FLYER_RECIPIENT_EMAIL` (website-form creation only), and optional gpt-image-2 background art. Hard-won constraints — do not relearn these:

- **Flyer PNG must render on the edge runtime.** `next/og` ImageResponse in the Node runtime breaks on Windows dev (font-path `ERR_INVALID_URL`). Node routes needing the PNG (e.g. sendFlyer) fetch `/api/flyer/[id]` from their own origin with `cache: "no-store"`.
- **Satori rules** (`app/utils/flyer.tsx`): text nodes must be a single string (template literals, never `{a} · {b}`); component libraries don't render (react-qr-code silently collapses) — the QR is a raw `<svg><path/>` built with `qrcode-generator`; remote images are silently dropped — fetch them yourself and pass the raw ArrayBuffer as `img src`.
- **Server-side Convex READS must use `convexQuery()`** from `app/utils/convexServer.ts` — Next 14 caches `fetch()` in route handlers and ConvexHttpClient rides on fetch, so direct queries return stale documents. Mutations stay on ConvexHttpClient.
- **Committee writes are secret-gated.** `events:create/update/archive/generateUploadUrl/setEventImage` require a `secret` arg matching `COMMITTEE_API_SECRET`. Browser code NEVER holds the secret — website writes go through the Clerk-authenticated `/api/events` route which injects it server-side. Email args on mutations are attribution only.
- **Convex deploys are manual.** After editing `convex/`: `npx convex dev --once` (dev) and `npx convex deploy` (prod) — Vercel only builds Next.js.
- Flyer fonts (Anton, Poppins) are checked into `app/fonts/` and loaded via `fetch(new URL(..., import.meta.url))`.
- Archiving an event hides it from the site but the flyer URL still renders — archive ≠ delete.
- **`events:remove` is the only true delete, and it cascades** — the event's RSVPs, feedback and interest taps go with it. It **refuses when the event has `payments` rows**: those are the receipt trail for money that actually changed hands, so archive that one instead. Secret-gated like the rest of `events:*`; the dashboard offers it only on already-archived events, through `/api/events` with `action: "delete"`.
- **Reads use Clerk↔Convex JWT auth.** `ConvexProviderWithClerk` (inside ClerkProvider — order matters) sends the Clerk JWT; committee-only queries check `ctx.auth.getUserIdentity()` — never a client-supplied email. Public queries must return sanitized fields only (`rsvps:getByEvent` → names, no PII). Requires: JWT template named "convex" in Clerk (created via Backend API), `CLERK_JWT_ISSUER_DOMAIN` set on both Convex deployments, `convex/auth.config.ts`.

### Payments (Stripe) — full reference in `Docs/payments.md`
Priced events (`events.priceCents`, dollars in the form → cents in the DB) get a "Pay Online" button → Stripe Checkout → `/pay/success` renders a door pass and emails a matching receipt. At-door cards go through Stripe Tap to Pay on a committee phone. Hard-won constraints:

- **Wrong Stripe account = disaster.** BluffStuff uses the **contextpro.ai** account (`acct_1HHugpHGDQRligtc`), NOT the LineCrush account the local `stripe` CLI is authed to. Never run `stripe` CLI commands or use CLI keys here — use `STRIPE_SECRET_KEY` (the `bluffstuff-website` key) only.
- **Amount is read server-side.** `/api/checkout` looks up `event.priceCents` from Convex — never trusts a client-supplied price.
- **The success page IS the proof.** It re-fetches the session from Stripe with the secret key and only shows "You're paid!" for a verified-paid session (accepts `paid` AND `no_payment_required` for $0 promos). That's why the screen/email is trustworthy at the door.
- **Recording + email are idempotent.** `payments:record` keys on the Stripe session id and returns `{ id, alreadyRecorded }`; the receipt email fires only when `alreadyRecorded` is false, so refreshes don't duplicate.
- **Receipt email reuses the flyer Gmail transport** (`GMAIL_USER`/`GMAIL_APP_PASSWORD`) — no separate provider. Template `app/utils/receiptEmail.ts` is table-based + inline-styles only (Gmail/Yahoo strip modern CSS).
- **`buttonClasses` must be imported from `app/components/ui/buttonStyles.ts`** (a plain module) in server components like `/pay/success` — importing it from the `"use client"` `Button.tsx` makes it a client reference and crashes the server render.
- **Convex deploys are still manual** — `payments.ts` lives in `convex/`, so `npx convex dev --once` + `npx convex deploy` after edits.

### Feedback, Interest & Ideas
Three anonymous, login-free signals that exist to answer "why did nobody come?". Hard-won constraints:

- **No sign-in, on purpose.** The responses worth having come from people who did NOT attend, and they will not create an account to explain why. `/feedback/*` is a public route in `middleware.ts`. Do not put any of these behind Clerk.
- **`visitorId` never leaves the server.** A random localStorage id (`app/hooks/useVisitorId.ts`) dedupes taps and votes. Public queries must return explicit field lists — `ideas:list` builds its payload field by field precisely so the submitter's `visitorId` can't leak and de-anonymize the board.
- **The feedback form leads with "Did you make it?"** The *No* branch (checkbox reasons) is the substantial one; the attendee rating is secondary. Reason keys live in `convex/feedbackOptions.ts` and are shared by the form, the Convex validator, and the dashboard tally — change a `label` freely, never repurpose a `key`.
- **Feedback is coherent server-side**: `feedback:submit` drops a rating for no-shows and reasons for attendees regardless of what the client sends, and upserts on `(eventId, visitorId)` so resubmitting amends rather than duplicates.
- **Attendance headcount is the point of the dashboard tab.** Without it, "nobody was interested" and "everyone RSVP'd then stayed home" are indistinguishable. Written via `events:setAttendance` — secret-gated like the other event mutations, through `/api/events` with `action: "attendance"`.
- **Interest taps are a soft signal, not a headcount.** Deduped per browser, so two devices count twice. RSVPs remain authoritative.
- **`events:listRecentPast` is active-only and windowed to 30 days.** Archiving an event removes it from the home page's "How Did We Do?" section — its feedback page is still reachable via the flyer URL, which also survives archiving. Don't archive an event until you've collected feedback.
- **Ideas auto-publish**; the committee hides rather than approves (an approval queue kills the momentum a vote board needs). `ideas:setHidden` gates on Clerk JWT identity via `convex/committeeAuth.ts`, not the shared secret.
- **Moderation deletes are JWT-gated too** (`contactMessages:remove/setRead`, `ideas:remove`, `feedback:remove`) — same `requireCommittee` helper. `ideas:remove` also deletes that idea's votes so no orphans are left behind. Destructive buttons use `ui/ConfirmButton` (tap to arm, tap to confirm, auto-disarms) — never `window.confirm`, which blocks the page and can't be themed.
- **The Messages badge counts unread, not total.** `contactMessages.isRead` is optional so existing rows stay valid; absent means unread.

### Admin Dashboard (`/admin`)
- Lives at its own route, **not** on the home page. Linked from the navbar only when `useIsCommittee()` is true.
- The page's role check is UX, not the security boundary: every committee query is gated in Convex and every event write goes through the secret-gated `/api/events`. A resident who forced their way in sees empty tabs and failed writes.
- Tabs are separate components (`Committee*Tab.tsx`) so the page stays readable; the shell owns the shared `events`/`contactMessages` queries and passes them down. Convex dedupes identical subscriptions, so tabs re-querying the same thing is free.
- The overview surfaces past events with no headcount recorded — the one omission that makes later analysis impossible.
- **The home page no longer waits on Clerk.** That `!isLoaded` gate existed only to stop the dashboard flashing in; don't reintroduce it.
- **Convex deploys are still manual** — `npx convex dev --once` + `npx convex deploy` after touching `convex/`.

## Key Files

| Purpose | Path |
|---------|------|
| Main entry / Home | `app/page.tsx` |
| Root layout | `app/layout.tsx` |
| Auth middleware | `middleware.ts` |
| Convex schema | `convex/schema.ts` |
| Event CRUD | `convex/events.ts` |
| RSVP mutations/queries | `convex/rsvps.ts` |
| Contact messages | `convex/contactMessages.ts` |
| User sync (Clerk → Convex) | `app/components/UserSync.tsx` |
| Committee role hook | `app/hooks/useIsCommittee.ts` |
| Admin seed page | `app/admin/seed/page.tsx` |
| Flyer template (satori/edge) | `app/utils/flyer.tsx` |
| Flyer PNG route | `app/api/flyer/[eventId]/route.ts` |
| Flyer page | `app/flyer/[eventId]/page.tsx` |
| Committee event writes (website) | `app/api/events/route.ts` |
| Flyer email route | `app/api/sendFlyer/route.ts` |
| Flyer art generation | `app/api/generateFlyerArt/route.ts` |
| Stripe checkout session | `app/api/checkout/route.ts` |
| Payment door pass + receipt | `app/pay/success/page.tsx` |
| Receipt email template | `app/utils/receiptEmail.ts` |
| Payments table/functions | `convex/payments.ts` |
| Public feedback page | `app/feedback/[eventId]/page.tsx` |
| No-show reason options (shared) | `convex/feedbackOptions.ts` |
| Feedback mutations/queries | `convex/feedback.ts` |
| Interest taps | `convex/interest.ts` + `app/components/InterestButton.tsx` |
| Idea board | `convex/ideas.ts` + `app/components/IdeaBoard.tsx` |
| Anonymous visitor id hook | `app/hooks/useVisitorId.ts` |
| Committee JWT role helper | `convex/committeeAuth.ts` |
| Admin dashboard page | `app/admin/page.tsx` |
| Turnout & feedback dashboard tab | `app/components/CommitteeFeedbackTab.tsx` |
| Confirm-to-delete control | `app/components/ui/ConfirmButton.tsx` |
| Server-side Convex reads (no-store) | `app/utils/convexServer.ts` |
| Type definitions | `types/Event.ts` |
| Next.js config | `next.config.mjs` |
| Tailwind config | `tailwind.config.ts` |

## Convex Tables

| Table | Purpose | Key Indexes |
|-------|---------|-------------|
| `users` | Clerk-synced user records with roles | `by_email` |
| `events` | Community events (CRUD by committee) | `by_date`, `by_active` |
| `rsvps` | Event attendance registrations | `by_event`, `by_email` |
| `payments` | Online Stripe payments (door-pass records) | `by_event`, `by_session` |
| `contactMessages` | Contact form submissions | — |
| `eventFeedback` | Anonymous post-event feedback (attended / why not) | `by_event`, `by_event_visitor` |
| `eventInterest` | One-tap interest on upcoming events | `by_event`, `by_event_visitor` |
| `eventIdeas` | Resident event suggestions | `by_hidden` |
| `ideaVotes` | Upvotes on ideas | `by_idea`, `by_idea_visitor` |

## Environment Variables

Required (never hardcode these):
- Clerk keys (managed by `@clerk/nextjs`)
- `CONVEX_DEPLOYMENT` — Convex project deployment URL
- `NEXT_PUBLIC_CONVEX_URL` — Convex client URL
- SendGrid / Nodemailer credentials (for email reminders)
- `FLYER_RECIPIENT_EMAIL` — where new-event flyer PNGs are auto-emailed (the committee member who prints them)
- `OPENAI_API_KEY` — flyer background art generation (gpt-image-2)
- `COMMITTEE_API_SECRET` — gates committee write mutations; must match on Vercel AND both Convex deployments (`npx convex env set COMMITTEE_API_SECRET <v> [--prod]`)
- `STRIPE_SECRET_KEY` — online event payments (Next.js only; Convex never talks to Stripe). Uses the contextpro.ai Stripe account — NOT the LineCrush account the local Stripe CLI is authed to
- `CLERK_JWT_ISSUER_DOMAIN` — Convex deployments only; the Clerk instance domain for JWT auth
