# Changelog

What changed on bluffstuff.vercel.app, newest first. Earlier history is in `git log`.

## 2026-10-12: Fewer dead ends for residents

A pass over the places where a resident could get stuck, see a confusing error, or land on a page that made no sense for that moment.

**For residents**
- Error messages are plain English now. Before, a problem with an RSVP could show something like "[CONVEX M(rsvps:create)] Server Error"; now it says what happened, for example "Please enter your name."
- Opening your RSVP from the reminder email works. Gmail opens links in its own little browser, which didn't recognize your phone, so the site said "You're already on the list" and stopped there. Now it finds your RSVP by your email and lets you change or cancel it.
- The reminder email is easier to read: big text, the full day and date (for example "Saturday, October 18"), time and place, and a big "See the event" button. Its link now opens your RSVP so you can change or cancel. It used to open a "Did you make it?" form for an event that hadn't happened yet.
- The day after an event, everyone who RSVP'd with an email gets a short thank-you with one button: "Tell us how it went - 2 quick questions". It also says sorry we missed you, for anyone who couldn't make it.
- The feedback page won't ask "Did you make it?" before the event. It says the event hasn't happened yet and offers a big button to the event page.
- Paying online: the price is per person, so you can now pay for up to 6 people in one go. The door pass and the emailed receipt both say how many people you paid for, and the receipt links back to the event.
- Old, mistyped or broken links show a friendly "This event isn't on the calendar anymore" or "We couldn't find that page" with a button to the upcoming events, instead of an error screen. If something breaks on our end, you see "Something went wrong on our end" with a Try again button.
- After an event is edited, the flyer picture updates within minutes everywhere (phones, shared-link previews, the printer email). Before, phones could keep showing the old flyer.
- Event cards on the home page are simpler: just RSVP (and Pay, for paid events) plus one "See details & add to calendar" button. Everything else is on the event's own page.
- The event page now shows the flyer itself, and has one "Add to my calendar" button that picks the right calendar for your phone.
- Dates read the way people talk: "Today at 6:00 PM", "Tomorrow at 6:00 PM", or "Saturday, October 18 at 6:00 PM", with a TODAY or TOMORROW tag on the card. An event drops off the list 3 hours after it starts instead of staying up all evening.
- "I'd come to this" is now "Maybe - I'm interested", with a line explaining what it's for.
- "Suggest an Event" goes to the idea board instead of the contact form.
- Bigger text in the bottom tab bar, the calendar and error messages; bigger buttons (at least 44 pixels) for closing windows, the menu, the calendar arrows and footer links. Each calendar day is now a real button, and tapping one scrolls to that day's events.
- Phones set to reduce motion no longer get the animations, and the FAQ and contact form show up right away on slow phones instead of waiting to fade in.
- Sharing an event now includes the date, time and place in the message, not just the link.
- On a computer, the "Aa" display settings window opens in the middle of the screen. It used to stick to the left edge because it opened from inside the blurred navbar; every pop-up window is now placed on the page itself (`ui/Modal` portals to `<body>`).

**For the committee**
- Online payments now record how many people each payment covers, so the door count matches.
- If the daily reminder run fails for a whole event (for example, the Gmail password stopped working), that event is no longer marked as sent, and the run shows as failed in Vercel. Rerun it the same day to send them.

**Under the hood**
- **Convex deploy required** (`bunx convex deploy -y`) before the frontend: new optional fields `payments.quantity` and `events.thankYouSentAt`; new functions `reminders:dueForThankYou` and `reminders:markThanked`; `events:getById` now takes a string and returns null for a malformed id; `rsvps:create` adopts an existing same-email RSVP instead of throwing; resident-facing throws in `rsvps`, `feedback`, `ideas`, `interest` and `contactMessages` are `ConvexError`.
- New: `app/utils/friendlyError.ts` (resident-safe error text), `app/utils/escapeHtml.ts`, `app/utils/attendeeEmails.ts` (reminder + thank-you templates), `app/components/EventGone.tsx`, `app/error.tsx`; `app/not-found.tsx` rewritten.
- `/api/checkout` line item has `adjustable_quantity` (1-6); `/pay/success` expands `line_items` to read it. Payer names and all other values in the receipt HTML are escaped.
- `/api/flyer/[eventId]` sends `Cache-Control: public, max-age=0, s-maxage=300, stale-while-revalidate=86400` instead of next/og's one-year immutable default.

## 2026-10-12: Sign In is back in the navbar

The previous release went too far and took Sign In off the navbar, leaving only a footer link labeled "Committee sign-in". Accounts are meant for everyone and required for no one, so:
- The navbar has a Sign In button again (desktop bar and the phone menu). It's outlined rather than orange, so it reads as optional.
- The footer "Committee sign-in" link is gone, so sign-in is no longer presented as committee-only.
- The FAQ's "Do I need an account?" now says signing in is optional and what it's for (keeping your text size and colors on every device).

Nothing changed for existing accounts. The committee dashboard, Austin's admin access and all sign-ins work exactly as before.

## 2026-10-11: Residents never need an account

Almost every resident uses the site on a phone, and most are older. This release removes every nudge toward an account and makes RSVPing and finding an event take as few taps as possible.

**For residents**
- The navbar no longer has a Sign In button. Everything works without an account. The committee signs in from a small footer link. (Reversed on 2026-10-12, above.)
- Every event has its own page (`/events/<id>`): big text, all the details, and one RSVP button. Flyer QR codes now open the event itself instead of the list, and texting the link shows the flyer as a preview.
- RSVP asks for a name and how many are coming (1-6 big buttons). Email and phone are optional; an email still gets the reminder the day before.
- The phone remembers you: next time your name is already filled in, the event shows "You're going (2)", and you can change the headcount or tap "I can't make it" from the same phone.
- A new Share button opens the phone's share sheet (Messages, WhatsApp, email).
- A new "Aa" button sets text size (Normal, Large, Extra large) and light or dark colors. It's saved on the phone, and anyone who signs in keeps it on all their devices.
- The contact form takes an email or a phone number.
- The FAQ answers "Do I need an account?", explains how to cancel an RSVP, and covers how to make the words bigger.

**For the committee**
- The dashboard's Events tab has a **Guests** button with each RSVP's name, headcount, notes and tap-to-call / tap-to-email.
- "Going" counts are now headcounts (party sizes added up), so they match what to buy food for.
- Messages left with only a phone number show a "Call back" button.
- Paying online and then cancelling at Stripe now returns to that event's page.

**Under the hood**
- Convex: `rsvps.email` is optional; added `rsvps.partySize`, `rsvps.visitorId` (+ `by_event_visitor` index), `contactMessages.email` optional, and `users.preferences`. New functions: `rsvps:myRsvp`, `rsvps:cancel`, `rsvps:listForCommittee`, `users:getMyPreferences`, `users:setMyPreferences`. The reminder cron skips RSVPs without an email.
- The flyer's QR panel now encodes `https://bluffstuff.vercel.app/events/<id>` and reads "RSVP FOR THIS EVENT". Existing flyers pick it up on their next render, and their AI posters are unchanged. Echo's `bluff_event.py` verify was updated to expect the new URL.
