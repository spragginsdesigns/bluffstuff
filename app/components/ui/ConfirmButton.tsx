"use client";

import { useEffect, useRef, useState } from "react";

interface ConfirmButtonProps {
	label: string;
	confirmLabel?: string;
	/** Return value is ignored; Convex mutations resolve to their own types. */
	onConfirm: () => unknown;
	/** Accessible description, e.g. `Delete message from Kim`. */
	ariaLabel?: string;
	className?: string;
}

const RESET_DELAY_MS = 4000;

/**
 * Two-tap destructive action: the first tap arms it, the second commits.
 *
 * Deliberately not `window.confirm` — a native modal blocks the page, reads
 * badly on a phone, and can't be styled to match. Arming resets itself after a
 * few seconds so a stray tap never leaves a live delete button sitting there.
 */
export default function ConfirmButton({
	label,
	confirmLabel = "Sure?",
	onConfirm,
	ariaLabel,
	className = ""
}: ConfirmButtonProps) {
	const [isArmed, setIsArmed] = useState(false);
	const [isBusy, setIsBusy] = useState(false);
	const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

	useEffect(() => {
		return () => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
		};
	}, []);

	const handleClick = async () => {
		if (isBusy) return;

		if (!isArmed) {
			setIsArmed(true);
			timeoutRef.current = setTimeout(() => setIsArmed(false), RESET_DELAY_MS);
			return;
		}

		if (timeoutRef.current) clearTimeout(timeoutRef.current);
		setIsBusy(true);
		try {
			await onConfirm();
		} finally {
			setIsBusy(false);
			setIsArmed(false);
		}
	};

	return (
		<button
			type="button"
			onClick={handleClick}
			disabled={isBusy}
			aria-label={ariaLabel ?? label}
			className={`px-3 py-1.5 rounded-lg text-sm border transition-colors disabled:opacity-60 ${
				isArmed
					? "bg-danger text-primary-fg border-danger"
					: "text-danger bg-danger-soft border-transparent hover:bg-danger-soft/70"
			} ${className}`}
		>
			{isBusy ? "…" : isArmed ? confirmLabel : label}
		</button>
	);
}
