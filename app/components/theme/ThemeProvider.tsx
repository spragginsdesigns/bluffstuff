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

	const setTheme = useCallback((next: Theme) => {
		setThemeState(next);
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

	const toggle = useCallback(() => {
		setThemeState((current) => {
			const next: Theme = current === "dark" ? "light" : "dark";
			document.documentElement.classList.toggle("dark", next === "dark");
			try {
				localStorage.setItem(THEME_STORAGE_KEY, next);
			} catch {
				// ignore
			}
			document
				.querySelectorAll('meta[name="theme-color"]')
				.forEach((el) => el.setAttribute("content", THEME_COLORS[next]));
			return next;
		});
	}, []);

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
