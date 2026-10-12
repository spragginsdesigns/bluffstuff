"use client";

import { useState } from "react";
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import Modal from "../ui/Modal";
import { useTheme, type Theme } from "./ThemeProvider";
import { useTextSize, type TextSize } from "./TextSizeProvider";

const TEXT_SIZE_OPTIONS: { value: TextSize; label: string; sample: string }[] = [
	{ value: "normal", label: "Normal", sample: "text-xl" },
	{ value: "large", label: "Large", sample: "text-2xl" },
	{ value: "xlarge", label: "Extra large", sample: "text-3xl" }
];

const THEME_OPTIONS: { value: Theme; label: string }[] = [
	{ value: "light", label: "Light" },
	{ value: "dark", label: "Dark" }
];

const optionClasses = (isSelected: boolean) =>
	`flex flex-col items-center justify-center gap-1 rounded-xl border-2 px-3 py-3 min-h-[64px] text-base font-semibold transition-colors ${
		isSelected
			? "border-primary bg-primary-soft text-primary-strong"
			: "border-border bg-surface-2 text-ink hover:border-primary/40"
	}`;

/**
 * "Aa" button + panel for text size and light/dark. No account needed -
 * settings save on the device, and follow a signed-in person everywhere
 * (see PreferencesSync).
 */
export default function DisplaySettings() {
	const [isOpen, setIsOpen] = useState(false);
	const { theme, setTheme } = useTheme();
	const { textSize, setTextSize } = useTextSize();

	return (
		<>
			<button
				type="button"
				onClick={() => setIsOpen(true)}
				aria-label="Text size and display settings"
				title="Text size and display settings"
				className="flex h-11 min-w-11 items-center justify-center rounded-xl px-2 font-display text-xl font-bold text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
			>
				<span aria-hidden="true">
					A<span className="text-base">a</span>
				</span>
			</button>

			{isOpen && (
				<Modal title="Display settings" onClose={() => setIsOpen(false)}>
					<fieldset className="mb-6">
						<legend className="text-base font-semibold text-ink mb-3">
							Text size
						</legend>
						<div className="grid grid-cols-3 gap-2">
							{TEXT_SIZE_OPTIONS.map((option) => (
								<button
									key={option.value}
									type="button"
									onClick={() => setTextSize(option.value)}
									aria-pressed={textSize === option.value}
									className={optionClasses(textSize === option.value)}
								>
									<span
										className={`font-display leading-none ${option.sample}`}
										aria-hidden="true"
									>
										Aa
									</span>
									<span className="text-sm">{option.label}</span>
								</button>
							))}
						</div>
					</fieldset>

					<fieldset className="mb-6">
						<legend className="text-base font-semibold text-ink mb-3">
							Colors
						</legend>
						<div className="grid grid-cols-2 gap-2">
							{THEME_OPTIONS.map((option) => (
								<button
									key={option.value}
									type="button"
									onClick={() => setTheme(option.value)}
									aria-pressed={theme === option.value}
									className={optionClasses(theme === option.value)}
								>
									{option.label}
								</button>
							))}
						</div>
					</fieldset>

					<div className="rounded-xl bg-surface-2 p-4 text-sm text-ink-muted">
						<SignedOut>
							<p>
								Saved on this device. You never need an account for anything
								on this site.
							</p>
							<p className="mt-2">
								Want these settings on all your devices?{" "}
								<SignInButton mode="modal">
									{/* Close first: our <dialog> makes everything outside it
									    inert, which would freeze Clerk's sign-in modal. */}
									<button
										type="button"
										onClick={() => setIsOpen(false)}
										className="font-semibold text-primary-strong underline underline-offset-2"
									>
										Sign in (optional)
									</button>
								</SignInButton>
							</p>
						</SignedOut>
						<SignedIn>
							<p>
								Saved to your account. They&apos;ll follow you to any device
								you sign in on.
							</p>
						</SignedIn>
					</div>
				</Modal>
			)}
		</>
	);
}
