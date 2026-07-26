/**
 * Single source of truth for the no-show reason checkboxes. Shared by the
 * public feedback form, the Convex validator, and the committee dashboard's
 * aggregation so the three can never drift apart.
 *
 * Keys are stored in the database and must stay stable — change a `label`
 * freely, but never repurpose a `key`.
 */

export interface NoShowReason {
	key: string;
	label: string;
}

export const NO_SHOW_REASONS: NoShowReason[] = [
	{ key: "didnt_know", label: "I didn't know about it" },
	{ key: "wrong_time", label: "The time didn't work for me" },
	{ key: "wrong_day", label: "The day didn't work for me" },
	{ key: "forgot", label: "I knew, but I forgot" },
	{ key: "transport", label: "I couldn't get there" },
	{ key: "health", label: "Health or mobility reasons" },
	{ key: "cost", label: "It cost too much" },
	{ key: "not_interested", label: "Not really my kind of event" },
	{ key: "weather", label: "The weather" },
	{ key: "other", label: "Something else" }
];

export const NO_SHOW_REASON_KEYS: string[] = NO_SHOW_REASONS.map((r) => r.key);

export function reasonLabel(key: string): string {
	return NO_SHOW_REASONS.find((r) => r.key === key)?.label ?? key;
}

// Free-text caps. Generous for a comment box, but bounded so an anonymous
// endpoint can't be used to write novels into the database.
export const MAX_COMMENT_LENGTH = 1000;
export const MAX_NAME_LENGTH = 80;
export const MAX_IDEA_TITLE_LENGTH = 120;
export const MAX_IDEA_DETAILS_LENGTH = 600;
