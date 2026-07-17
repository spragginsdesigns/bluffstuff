"use client";

interface SectionProps {
	id: string;
	title: string;
	subtitle?: string;
	tinted?: boolean;
	className?: string;
	children: React.ReactNode;
}

export default function Section({
	id,
	title,
	subtitle,
	tinted,
	className = "",
	children
}: SectionProps) {
	return (
		<section
			id={id}
			className={`container mx-auto px-4 py-12 md:py-16 scroll-mt-20 ${className}`}
		>
			<div className="text-center mb-8">
				<h2 className="font-display text-3xl md:text-4xl font-semibold text-ink">
					{title}
				</h2>
				{subtitle && (
					<p className="text-ink-muted mt-2 text-base md:text-lg">
						{subtitle}
					</p>
				)}
			</div>
			{tinted ? (
				<div className="bg-surface-2/60 rounded-3xl border border-border p-5 md:p-8">
					{children}
				</div>
			) : (
				children
			)}
		</section>
	);
}
