"use client";

import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState
} from "react";

export type TextSize = "normal" | "large" | "xlarge";

export const TEXT_SIZES: TextSize[] = ["normal", "large", "xlarge"];
const TEXT_SIZE_STORAGE_KEY = "bs-text-size";

interface TextSizeContextValue {
	textSize: TextSize;
	setTextSize: (size: TextSize) => void;
}

const TextSizeContext = createContext<TextSizeContextValue>({
	textSize: "normal",
	setTextSize: () => {}
});

export function isTextSize(value: unknown): value is TextSize {
	return TEXT_SIZES.includes(value as TextSize);
}

/**
 * Site-wide text size for residents who find the default too small.
 *
 * Applied as `data-text-size` on <html>; globals.css raises the root font
 * size for it, and because Tailwind sizes in rem the whole page scales.
 * The inline script in layout.tsx applies the saved size before first paint.
 */
export function TextSizeProvider({ children }: { children: React.ReactNode }) {
	const [textSize, setTextSizeState] = useState<TextSize>(() => {
		if (typeof document === "undefined") return "normal";
		const current = document.documentElement.dataset.textSize;
		return isTextSize(current) ? current : "normal";
	});

	// Side effects live here, called from handlers - never inside a setState
	// updater (see the same rule in ThemeProvider).
	const setTextSize = useCallback((next: TextSize) => {
		if (next === "normal") {
			delete document.documentElement.dataset.textSize;
		} else {
			document.documentElement.dataset.textSize = next;
		}
		try {
			localStorage.setItem(TEXT_SIZE_STORAGE_KEY, next);
		} catch {
			// storage unavailable (private mode) - still applies for the session
		}
		setTextSizeState(next);
	}, []);

	const value = useMemo(
		() => ({ textSize, setTextSize }),
		[textSize, setTextSize]
	);

	return (
		<TextSizeContext.Provider value={value}>
			{children}
		</TextSizeContext.Provider>
	);
}

export function useTextSize() {
	return useContext(TextSizeContext);
}
