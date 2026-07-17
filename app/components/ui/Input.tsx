"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

export const inputClasses =
	"w-full rounded-lg bg-surface border border-border px-4 py-3 text-base text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary transition-colors";

const Input = forwardRef<
	HTMLInputElement,
	InputHTMLAttributes<HTMLInputElement>
>(function Input({ className = "", ...props }, ref) {
	return (
		<input ref={ref} className={`${inputClasses} ${className}`} {...props} />
	);
});

export default Input;
