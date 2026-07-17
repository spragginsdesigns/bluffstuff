"use client";

interface FieldProps {
	label: string;
	htmlFor: string;
	required?: boolean;
	children: React.ReactNode;
}

export default function Field({
	label,
	htmlFor,
	required,
	children
}: FieldProps) {
	return (
		<div>
			<label
				htmlFor={htmlFor}
				className="block text-base font-medium text-ink mb-1.5"
			>
				{label}
				{required && (
					<span className="text-danger ml-0.5" aria-hidden="true">
						*
					</span>
				)}
			</label>
			{children}
		</div>
	);
}
