// Plain module (no "use client") so server components can also build
// button-styled links — functions exported from a client module aren't
// callable on the server.
export type ButtonVariant =
	| "primary"
	| "secondary"
	| "outline"
	| "ghost"
	| "danger";
export type ButtonSize = "md" | "lg";

const BASE =
	"inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors focus-visible:ring-2 ring-offset-2 ring-offset-bg disabled:opacity-50 disabled:cursor-not-allowed";

const VARIANTS: Record<ButtonVariant, string> = {
	primary: "bg-primary text-primary-fg hover:bg-primary-strong",
	secondary: "bg-accent text-accent-fg hover:bg-accent-strong",
	outline: "border border-border bg-surface text-ink hover:bg-surface-2",
	ghost: "text-ink-muted hover:bg-surface-2 hover:text-ink",
	danger: "bg-danger-soft text-danger hover:bg-danger hover:text-primary-fg"
};

const SIZES: Record<ButtonSize, string> = {
	md: "px-5 py-2.5 text-base min-h-[44px]",
	lg: "px-7 py-3.5 text-lg min-h-[52px]"
};

// For styling <Link>/<a>/<SignInButton> children like a Button.
export function buttonClasses(
	variant: ButtonVariant = "primary",
	size: ButtonSize = "md",
	extra = ""
) {
	return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${extra}`.trim();
}
