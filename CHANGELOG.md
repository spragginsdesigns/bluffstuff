# Changelog

What changed on bluffstuff.vercel.app, newest first. Earlier history is in `git log`.

## 2026-10-11: Residents never need an account

Almost every resident uses the site on a phone, and most are older. This release removes every nudge toward an account and makes RSVPing and finding an event take as few taps as possible.

**For residents**
- The navbar no longer has a Sign In button. Everything works without an account. The committee signs in from a small footer link.
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
