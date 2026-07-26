// Single source of truth for the public site identity.
// Update SITE_URL if the production domain ever changes — the QR code,
// metadata, and social cards all derive from it.
export const SITE_NAME = "BluffStuff";
export const SITE_URL = "https://bluffstuff.vercel.app";
export const SITE_URL_DISPLAY = "bluffstuff.vercel.app";

/**
 * Display name on every outgoing email.
 *
 * All mail is sent through one Gmail account (`GMAIL_USER`), so without this
 * residents would see a bare personal address in their inbox — which reads as
 * a stranger, not the committee. Always send via `mailFrom()`.
 */
export const MAIL_FROM_NAME = "Woodward Bluffs Activities";

export function mailFrom(address: string): string {
	return `"${MAIL_FROM_NAME}" <${address}>`;
}
