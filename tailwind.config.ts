/** @type {import('tailwindcss').Config} */

const v = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

const config = {
	content: [
		"./pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./components/**/*.{js,ts,jsx,tsx,mdx}",
		"./app/**/*.{js,ts,jsx,tsx,mdx}"
	],
	theme: {
		extend: {
			colors: {
				bg: v("--bg"),
				surface: {
					DEFAULT: v("--surface"),
					2: v("--surface-2")
				},
				ink: {
					DEFAULT: v("--ink"),
					muted: v("--ink-muted"),
					faint: v("--ink-faint")
				},
				primary: {
					DEFAULT: v("--primary"),
					strong: v("--primary-strong"),
					soft: v("--primary-soft"),
					fg: v("--primary-fg")
				},
				accent: {
					DEFAULT: v("--accent"),
					strong: v("--accent-strong"),
					soft: v("--accent-soft"),
					fg: v("--accent-fg")
				},
				danger: {
					DEFAULT: v("--danger"),
					soft: v("--danger-soft")
				},
				border: v("--border")
			},
			ringColor: {
				DEFAULT: v("--ring")
			},
			fontFamily: {
				sans: ["var(--font-body)", "system-ui", "sans-serif"],
				display: ["var(--font-display)", "Georgia", "serif"]
			},
			boxShadow: {
				card: "0 1px 2px rgb(46 38 32 / 0.06), 0 4px 16px rgb(46 38 32 / 0.06)",
				lifted:
					"0 4px 12px rgb(46 38 32 / 0.10), 0 12px 32px rgb(46 38 32 / 0.10)"
			}
		}
	},
	darkMode: "class",
	plugins: []
};

export default config;
