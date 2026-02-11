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

**Stack:** Next.js 14 (App Router) + Clerk Auth + Convex + Vercel Postgres + Tailwind CSS + NextUI
**Repo:** https://github.com/spragginsdesigns/bluffstuff
**Deployed:** https://bluffstuff.vercel.app/
**Year:** 2026

## Terminology

| Term | Meaning | Location |
|------|---------|----------|
| BluffStuff | Woodward Bluffs Mobile Home Park Activities Committee website | Root |
| Committee | Admin users who manage events (role: "committee") | `convex/schema.ts` |
| Resident | Regular community members (role: "resident") | `convex/schema.ts` |
| RSVP | Event attendance registration | `app/api/rsvp/` |
| Attendee | Person registered for an event | `types/Event.ts` |

## Project Structure

```
bluffstuff/
├── app/                    # Next.js App Router pages & components
│   ├── api/                # API routes (rsvp, getRSVPs, sendReminders)
│   ├── components/         # React components (NavBar, EventCard, Hero, etc.)
│   ├── providers/          # ConvexClientProvider
│   ├── utils/              # Calendar, event utilities
│   ├── sign-in/            # Clerk sign-in page
│   ├── sign-up/            # Clerk sign-up page
│   ├── admin/seed/         # Admin seed page
│   ├── layout.tsx          # Root layout (Clerk + Convex + NextUI providers)
│   └── page.tsx            # Home page
├── convex/                 # Convex backend (schema, users, seed)
├── data/                   # Static data files
├── interfaces/             # TypeScript interfaces
├── pages/                  # Next.js Pages Router (legacy/mixed)
├── public/                 # Static assets
├── types/                  # Shared type definitions (Event, Attendee)
├── middleware.ts           # Clerk auth middleware
├── tailwind.config.ts      # Tailwind configuration
└── next.config.mjs         # Next.js config (Vercel Postgres env)
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

- Auth is handled by Clerk - use `@clerk/nextjs` hooks and components
- State management uses Convex - mutations/queries go in `convex/` directory
- Database: Convex for user data, Vercel Postgres for RSVPs
- UI framework is NextUI (`@nextui-org/react`) with Tailwind CSS
- Public routes: `/`, `/sign-in`, `/sign-up`, `/api/uploadthing` (see `middleware.ts`)
- All other routes require authentication via Clerk middleware
- File uploads via UploadThing
- Email via SendGrid (`@sendgrid/mail`) and Nodemailer

## Key Files

| Purpose | Path |
|---------|------|
| Main entry / Home | `app/page.tsx` |
| Root layout | `app/layout.tsx` |
| API routes | `app/api/` |
| Auth middleware | `middleware.ts` |
| Convex schema | `convex/schema.ts` |
| Type definitions | `types/Event.ts` |
| Next.js config | `next.config.mjs` |
| Tailwind config | `tailwind.config.ts` |

## Environment Variables

Required (never hardcode these):
- `POSTGRES_URL` - Vercel Postgres connection
- Clerk keys (managed by `@clerk/nextjs`)
- Convex deployment URL
- SendGrid / Nodemailer credentials
- UploadThing keys
