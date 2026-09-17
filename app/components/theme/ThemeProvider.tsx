"use client";

import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState
} from "react";

export type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "bs-theme";
const THEME_COLORS: Record<Theme, string> = {
	light: "#FAF6EF",
	dark: "#211C18"
};

interface ThemeContextValue {
	theme: Theme;
	setTheme: (theme: Theme) => void;
	toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
	theme: "light",
	setTheme: () => {},
	toggle: () => {}
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	// The inline script in layout.tsx has already set the class before paint.
	const [theme, setThemeState] = useState<Theme>(() =>
		typeof document !== "undefined" &&
		document.documentElement.classList.contains("dark")
			? "dark"
			: "light"
	);

	// Applies a theme to the DOM + storage. Called from event handlers only —
	// NEVER from inside a setState updater. React may invoke updaters more
	// than once (retried/discarded concurrent renders), so side effects in an
	// updater can run twice: the class flips back while state moves on, and a
	// click appears to "do nothing" until clicked again.
	const applyTheme = useCallback((next: Theme) => {
		document.documentElement.classList.toggle("dark", next === "dark");
		try {
			localStorage.setItem(THEME_STORAGE_KEY, next);
		} catch {
			// storage unavailable (private mode) — theme still applies for the session
		}
		document
			.querySelectorAll('meta[name="theme-color"]')
			.forEach((el) => el.setAttribute("content", THEME_COLORS[next]));
	}, []);

	const setTheme = useCallback(
		(next: Theme) => {
			applyTheme(next);
			setThemeState(next);
		},
		[applyTheme]
	);

	const toggle = useCallback(() => {
		setTheme(theme === "dark" ? "light" : "dark");
	}, [theme, setTheme]);

	const value = useMemo(
		() => ({ theme, setTheme, toggle }),
		[theme, setTheme, toggle]
	);

	return (
		<ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
	);
}

export function useTheme() {
	return useContext(ThemeContext);
}
