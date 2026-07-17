"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Textarea from "./ui/Textarea";
import Field from "./ui/Field";
import { inputClasses } from "./ui/Input";

interface FormData {
	name: string;
	email: string;
	phone: string;
	subject: string;
	message: string;
}

export default function ContactForm() {
	const submitMessage = useMutation(api.contactMessages.submit);

	const [formData, setFormData] = useState<FormData>({
		name: "",
		email: "",
		phone: "",
		subject: "",
		message: ""
	});

	const [status, setStatus] = useState<
		"idle" | "submitting" | "success" | "error"
	>("idle");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setStatus("submitting");

		try {
			await submitMessage({
				name: formData.name,
				email: formData.email,
				phone: formData.phone || undefined,
				subject: formData.subject,
				message: formData.message
			});
			setStatus("success");
			setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
		} catch {
			setStatus("error");
		}
	};

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	return (
		<section id="contact" className="py-16 md:py-24 scroll-mt-20">
			<div className="container mx-auto px-4 max-w-2xl">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.5 }}
				>
					<div className="text-center mb-10">
						<h2 className="font-display text-3xl md:text-4xl font-semibold text-ink">
							Get Involved
						</h2>
						<p className="mt-3 text-ink-muted text-base md:text-lg">
							Suggest an event, volunteer, or just say hello — we&apos;d love
							to hear from you.
						</p>
					</div>

					<div className="bg-surface rounded-2xl p-6 md:p-8 border border-border shadow-card">
						{status === "success" ? (
							<motion.div
								initial={{ opacity: 0, scale: 0.95 }}
								animate={{ opacity: 1, scale: 1 }}
								className="text-center py-12"
							>
								<div className="w-16 h-16 mx-auto mb-5 rounded-full bg-accent-soft flex items-center justify-center">
									<svg
										className="w-8 h-8 text-accent-strong"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										aria-hidden="true"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M5 13l4 4L19 7"
										/>
									</svg>
								</div>
								<h3 className="font-display text-xl font-bold text-ink mb-2">
									Message Sent!
								</h3>
								<p className="text-ink-muted mb-6">
									The committee will get back to you soon.
								</p>
								<Button variant="outline" onClick={() => setStatus("idle")}>
									Send Another Message
								</Button>
							</motion.div>
						) : (
							<form onSubmit={handleSubmit} className="space-y-5">
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<Field label="Name" htmlFor="name" required>
										<Input
											type="text"
											id="name"
											name="name"
											required
											placeholder="Your name"
											value={formData.name}
											onChange={handleChange}
										/>
									</Field>
									<Field label="Email" htmlFor="email" required>
										<Input
											type="email"
											id="email"
											name="email"
											required
											placeholder="you@example.com"
											value={formData.email}
											onChange={handleChange}
										/>
									</Field>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<Field label="Phone (optional)" htmlFor="phone">
										<Input
											type="tel"
											id="phone"
											name="phone"
											placeholder="(555) 123-4567"
											value={formData.phone}
											onChange={handleChange}
										/>
									</Field>
									<Field label="Subject" htmlFor="subject" required>
										<select
											id="subject"
											name="subject"
											required
											value={formData.subject}
											onChange={handleChange}
											className={`${inputClasses} appearance-none bg-[length:16px_16px] bg-[right_12px_center] bg-no-repeat`}
											style={{
												backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%237a6e60'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`
											}}
										>
											<option value="">Select a subject</option>
											<option value="Event Suggestion">Event Suggestion</option>
											<option value="General Inquiry">General Inquiry</option>
											<option value="Volunteer">I Want to Volunteer</option>
											<option value="Feedback">Feedback</option>
											<option value="Other">Other</option>
										</select>
									</Field>
								</div>

								<Field label="Message" htmlFor="message" required>
									<Textarea
										id="message"
										name="message"
										required
										value={formData.message}
										onChange={handleChange}
										rows={5}
										placeholder="Tell us what's on your mind..."
									/>
								</Field>

								{status === "error" && (
									<motion.div
										initial={{ opacity: 0, y: 5 }}
										animate={{ opacity: 1, y: 0 }}
										className="p-3 rounded-xl bg-danger-soft text-danger text-sm"
									>
										Something went wrong. Please try again.
									</motion.div>
								)}

								<Button
									type="submit"
									size="lg"
									disabled={status === "submitting"}
									className="w-full"
								>
									{status === "submitting" ? (
										<span className="flex items-center justify-center gap-2">
											<svg
												className="w-4 h-4 animate-spin"
												fill="none"
												viewBox="0 0 24 24"
												aria-hidden="true"
											>
												<circle
													className="opacity-25"
													cx="12"
													cy="12"
													r="10"
													stroke="currentColor"
													strokeWidth="4"
												/>
												<path
													className="opacity-75"
													fill="currentColor"
													d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
												/>
											</svg>
											Sending...
										</span>
									) : (
										"Send Message"
									)}
								</Button>
							</form>
						)}
					</div>
				</motion.div>
			</div>
		</section>
	);
}
