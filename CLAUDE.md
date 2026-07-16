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

**Stack:** Next.js 14 (App Router) + Clerk Auth + Convex (real-time DB) + Tailwind CSS + NextUI + Framer Motion
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
│   │   ├── CommitteeDashboard.tsx # 3-tab admin panel (Events, Messages, Members)
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
│   ├── layout.tsx          # Root layout (Convex + Clerk + NextUI + UserSync)
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

- Dark-first design (primary bg: `bg-[#131111]`)
- Subtle depth: blur, transparency, layered gradients
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
- UI framework: NextUI (`@nextui-org/react`) + Tailwind CSS + Framer Motion animations
- Dark-first design: primary bg `bg-[#131111]`, glassmorphism cards, gradient accents
- Mobile-first responsive: all components must work beautifully on phones
- Modern aesthetic: inspired by shadcn/ui, Aceternity UI, Magic UI
- Single-page layout with smooth scroll-to-section navigation

### Routes & Middleware
- Public routes: `/`, `/sign-in`, `/sign-up` (see `middleware.ts`)
- All other routes require Clerk authentication
- Home page uses anchor sections: `#events`, `#calendar`, `#committee`, `#resources`, `#faq`, `#contact`

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
| Type definitions | `types/Event.ts` |
| Next.js config | `next.config.mjs` |
| Tailwind config | `tailwind.config.ts` |

## Convex Tables

| Table | Purpose | Key Indexes |
|-------|---------|-------------|
| `users` | Clerk-synced user records with roles | `by_email` |
| `events` | Community events (CRUD by committee) | `by_date`, `by_active` |
| `rsvps` | Event attendance registrations | `by_event`, `by_email` |
| `contactMessages` | Contact form submissions | — |

## Environment Variables

Required (never hardcode these):
- Clerk keys (managed by `@clerk/nextjs`)
- `CONVEX_DEPLOYMENT` — Convex project deployment URL
- `NEXT_PUBLIC_CONVEX_URL` — Convex client URL
- SendGrid / Nodemailer credentials (for email reminders)
- `FLYER_RECIPIENT_EMAIL` — where new-event flyer PNGs are auto-emailed (the committee member who prints them)
