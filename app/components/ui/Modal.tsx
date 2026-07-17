"use client";

import { useEffect, useId, useRef } from "react";
import { motion } from "framer-motion";

interface ModalProps {
	title: string;
	onClose: () => void;
	children: React.ReactNode;
	size?: "md" | "lg";
}

/**
 * Accessible modal built on the native <dialog> element: showModal() gives
 * focus containment (inert background), Escape handling via onCancel, and
 * implicit aria-modal. Render conditionally: {isOpen && <Modal ...>}.
 * This is the ONE place body scroll-lock lives.
 */
export default function Modal({
	title,
	onClose,
	children,
	size = "md"
}: ModalProps) {
	const ref = useRef<HTMLDialogElement>(null);
	const titleId = useId();

	useEffect(() => {
		ref.current?.showModal();
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = "unset";
		};
	}, []);

	return (
		<dialog
			ref={ref}
			aria-labelledby={titleId}
			onCancel={(e) => {
				e.preventDefault();
				onClose();
			}}
			onClick={(e) => {
				// Clicks on the dialog element itself (not its children) are
				// on the backdrop area.
				if (e.target === ref.current) onClose();
			}}
			className={`w-[calc(100%-2rem)] ${
				size === "lg" ? "max-w-2xl" : "max-w-md"
			}`}
		>
			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.2 }}
				className="bg-surface rounded-2xl border border-border shadow-lifted max-h-[90vh] overflow-y-auto"
			>
				<div className="flex items-start justify-between gap-4 p-6 pb-0">
					<h2
						id={titleId}
						className="font-display text-2xl font-semibold text-ink"
					>
						{title}
					</h2>
					<button
						type="button"
						onClick={onClose}
						aria-label="Close dialog"
						className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
					>
						<svg
							className="h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth={2}
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>
				<div className="p-6">{children}</div>
			</motion.div>
		</dialog>
	);
}
