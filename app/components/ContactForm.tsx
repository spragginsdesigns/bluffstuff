"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";

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

	const inputClasses =
		"w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200";

	return (
		<section
			id="contact"
			className="py-16 md:py-24 bg-gradient-to-b from-[#131111] to-gray-900"
		>
			<div className="container mx-auto px-4 max-w-2xl">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.5 }}
				>
					<div className="text-center mb-10">
						<h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
							Contact Us
						</h2>
						<p className="mt-3 text-gray-400">
							Have a question or suggestion? We&apos;d love to hear from you.
						</p>
					</div>

					<div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-white/[0.06] shadow-2xl shadow-purple-500/5">
						{status === "success" ? (
							<motion.div
								initial={{ opacity: 0, scale: 0.95 }}
								animate={{ opacity: 1, scale: 1 }}
								className="text-center py-12"
							>
								<div className="w-16 h-16 mx-auto mb-5 rounded-full bg-green-500/20 flex items-center justify-center">
									<svg
										className="w-8 h-8 text-green-400"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M5 13l4 4L19 7"
										/>
									</svg>
								</div>
								<h3 className="text-xl font-bold text-white mb-2">
									Message Sent!
								</h3>
								<p className="text-gray-400 mb-6">
									The committee will get back to you soon.
								</p>
								<button
									onClick={() => setStatus("idle")}
									className="px-5 py-2.5 rounded-xl text-sm text-gray-300 border border-white/10 hover:bg-white/5 transition-colors"
								>
									Send Another Message
								</button>
							</motion.div>
						) : (
							<form onSubmit={handleSubmit} className="space-y-5">
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div>
										<label
											htmlFor="name"
											className="block text-sm font-medium text-gray-400 mb-2"
										>
											Name
										</label>
										<input
											type="text"
											id="name"
											name="name"
											required
											placeholder="Your name"
											value={formData.name}
											onChange={handleChange}
											className={inputClasses}
										/>
									</div>
									<div>
										<label
											htmlFor="email"
											className="block text-sm font-medium text-gray-400 mb-2"
										>
											Email
										</label>
										<input
											type="email"
											id="email"
											name="email"
											required
											placeholder="you@example.com"
											value={formData.email}
											onChange={handleChange}
											className={inputClasses}
										/>
									</div>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div>
										<label
											htmlFor="phone"
											className="block text-sm font-medium text-gray-400 mb-2"
										>
											Phone{" "}
											<span className="text-gray-600">(optional)</span>
										</label>
										<input
											type="tel"
											id="phone"
											name="phone"
											placeholder="(555) 123-4567"
											value={formData.phone}
											onChange={handleChange}
											className={inputClasses}
										/>
									</div>
									<div>
										<label
											htmlFor="subject"
											className="block text-sm font-medium text-gray-400 mb-2"
										>
											Subject
										</label>
										<select
											id="subject"
											name="subject"
											required
											value={formData.subject}
											onChange={handleChange}
											className={`${inputClasses} appearance-none bg-[length:16px_16px] bg-[right_12px_center] bg-no-repeat`}
											style={{
												backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`
											}}
										>
											<option value="" className="bg-gray-800">
												Select a subject
											</option>
											<option value="Event Suggestion" className="bg-gray-800">
												Event Suggestion
											</option>
											<option value="General Inquiry" className="bg-gray-800">
												General Inquiry
											</option>
											<option value="Volunteer" className="bg-gray-800">
												I Want to Volunteer
											</option>
											<option value="Feedback" className="bg-gray-800">
												Feedback
											</option>
											<option value="Other" className="bg-gray-800">
												Other
											</option>
										</select>
									</div>
								</div>

								<div>
									<label
										htmlFor="message"
										className="block text-sm font-medium text-gray-400 mb-2"
									>
										Message
									</label>
									<textarea
										id="message"
										name="message"
										required
										value={formData.message}
										onChange={handleChange}
										rows={5}
										placeholder="Tell us what's on your mind..."
										className={`${inputClasses} resize-none`}
									/>
								</div>

								{status === "error" && (
									<motion.div
										initial={{ opacity: 0, y: 5 }}
										animate={{ opacity: 1, y: 0 }}
										className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
									>
										Something went wrong. Please try again.
									</motion.div>
								)}

								<button
									type="submit"
									disabled={status === "submitting"}
									className="w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-200 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 hover:shadow-lg hover:shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
								>
									{status === "submitting" ? (
										<span className="flex items-center justify-center gap-2">
											<svg
												className="w-4 h-4 animate-spin"
												fill="none"
												viewBox="0 0 24 24"
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
								</button>
							</form>
						)}
					</div>
				</motion.div>
			</div>
		</section>
	);
}
