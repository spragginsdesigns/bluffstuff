# Woodward Bluffs Activities Committee Website

Website: https://bluffstuff.vercel.app/

## Project Overview

A dedicated website for the Woodward Bluffs mobile home park activities committee, focused on planning and promoting community events, providing information about the park, and offering guidance on Fresno's mobile home laws. The site serves as a central hub for community engagement and event planning.

## Committee Structure

- Leader: Bob Walker
- Secretary & Treasurer: Austin Spraggins
- Board Members:
  - Del
  - Kim
  - Donalee
  - Jeff
  - Additional members

Monthly Meetings: First Tuesday of every month

## Key Features

- Event Planning & Management System
- Community Event Calendar
- Mobile Home Living Resources
  - Fresno Mobile Home Laws
  - Community Guidelines
  - Resident Resources
- Committee Meeting Tools
  - Agenda Planning
  - Minutes Recording
  - Task Assignment
- Event Budget Management
- Photo Gallery of Past Events

## Communication Style

- Semi-formal and professional
- Supportive and welcoming tone
- Community-focused language
- Clear and accessible information
- Emphasis on accurate mobile home living advice

## Technical Stack

- Framework: Next.js 14 (App Router)
- Language: TypeScript
- Auth: Clerk (Google SSO)
- Database + file storage: Convex (real-time)
- Payments: Stripe (event payments + Tap to Pay at the door — see `Docs/payments.md`)
- Styling: Tailwind CSS (design tokens, light/dark themes) + Framer Motion
- UI Components: Hand-rolled primitives in `app/components/ui/`
- Email: nodemailer (Gmail) — flyers, reminders, payment receipts
- Deployment: Vercel (website) + Convex (backend functions, deployed separately)

> This file is the original project brief. For current architecture see the root `README.md` and `CLAUDE.md`.

## Project Structure

- `/app`: Main application code
  - `/components`: Reusable UI components
  - `/utils`: Utility functions
  - `/api`: API routes
- `/types`: TypeScript type definitions
- `/public`: Static assets
- `/data`: Event and activity data

## Color Scheme

Warm, community-friendly palette via themed design tokens (defined in `app/globals.css`, mapped in `tailwind.config.ts`). Never hardcode colors — use tokens (`bg-bg`, `bg-surface`, `text-ink`, `bg-primary`, `bg-accent`, …).

- Light mode (default): cream / terracotta / sage
- Dark mode (`.dark` on `<html>`): warm charcoal
- Fonts: Fraunces (display) + Atkinson Hyperlegible (body) — big, readable type for all ages

## TODO Improvements

1. Committee Dashboard

   - Meeting agenda templates
   - Minutes recording system
   - Member-specific tasks
   - Event planning workflow
2. Event Management

   - Monthly event calendar
   - Budget tracking per event
   - Supply checklists
   - Volunteer sign-up forms
3. Resource Center

   - Fresno mobile home laws section
   - Community guidelines
   - FAQ for residents
   - Important contacts
4. Communication Tools

   - Event announcement system
   - Committee updates section
   - Resident feedback forms
   - Newsletter templates
5. Photo & Documentation

   - Event photo galleries
   - Committee meeting archives
   - Document repository
   - Success stories showcase
6. Mobile Home Living

   - Local resources section
   - Community tips
   - Seasonal event ideas
   - Resident spotlights

## Regular Updates

- Monthly meeting summaries
- Upcoming events calendar
- Committee member updates
- Community announcements
- Photo gallery updates
- Resource library maintenance
