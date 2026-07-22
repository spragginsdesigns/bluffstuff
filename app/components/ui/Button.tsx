"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import {
	buttonClasses,
	type ButtonSize,
	type ButtonVariant
} from "./buttonStyles";

export { buttonClasses };
export type { ButtonSize, ButtonVariant };

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
	{ variant = "primary", size = "md", className = "", type = "button", ...props },
	ref
) {
	return (
		<button
			ref={ref}
			type={type}
			className={buttonClasses(variant, size, className)}
			{...props}
		/>
	);
});

export default Button;
