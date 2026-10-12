/**
 * Escapes text for interpolation into an HTML email. Names, titles and
 * locations are typed by residents and the committee, so an "&" or "<" must
 * render as written rather than break the markup or inject tags.
 */
export function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}
