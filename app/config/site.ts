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

/**
 * Builds the From header. Server-side only.
 *
 * `MAIL_FROM_ADDRESS` lets the visible sender differ from the account that
 * actually authenticates (`GMAIL_USER`), so moving to a committee alias is an
 * env-var change rather than a code change.
 *
 * IMPORTANT: Gmail rewrites From back to the authenticated account unless the
 * address is a verified "Send mail as" identity on that account. Setting this
 * variable without adding the alias in Gmail first does nothing — the mail
 * still goes out as GMAIL_USER. Add the alias, then set the variable.
 */
export function mailSenderAddress(authenticatedAddress: string): string {
	return process.env.MAIL_FROM_ADDRESS?.trim() || authenticatedAddress;
}

export function mailFrom(authenticatedAddress: string): string {
	return `"${MAIL_FROM_NAME}" <${mailSenderAddress(authenticatedAddress)}>`;
}
