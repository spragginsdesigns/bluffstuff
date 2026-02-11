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

	return (
		<section id="contact" className="py-12 md:py-16 bg-gradient-to-br from-gray-900 to-gray-800">
			<div className="container mx-auto px-4 max-w-4xl">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
				>
					<h2 className="text-2xl md:text-3xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
						Contact Us
					</h2>

					<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 md:p-8 border border-gray-700">
						<form onSubmit={handleSubmit} className="space-y-5">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
								<div>
									<label
										htmlFor="name"
										className="block text-sm font-medium text-gray-300 mb-1.5"
									>
										Name
									</label>
									<input
										type="text"
										id="name"
										name="name"
										required
										value={formData.name}
										onChange={handleChange}
										className="w-full px-4 py-2.5 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
									/>
								</div>
								<div>
									<label
										htmlFor="email"
										className="block text-sm font-medium text-gray-300 mb-1.5"
									>
										Email
									</label>
									<input
										type="email"
										id="email"
										name="email"
										required
										value={formData.email}
										onChange={handleChange}
										className="w-full px-4 py-2.5 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
									/>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
								<div>
									<label
										htmlFor="phone"
										className="block text-sm font-medium text-gray-300 mb-1.5"
									>
										Phone (optional)
									</label>
									<input
										type="tel"
										id="phone"
										name="phone"
										value={formData.phone}
										onChange={handleChange}
										className="w-full px-4 py-2.5 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
									/>
								</div>
								<div>
									<label
										htmlFor="subject"
										className="block text-sm font-medium text-gray-300 mb-1.5"
									>
										Subject
									</label>
									<select
										id="subject"
										name="subject"
										required
										value={formData.subject}
										onChange={handleChange}
										className="w-full px-4 py-2.5 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
									>
										<option value="">Select a subject</option>
										<option value="Event Suggestion">Event Suggestion</option>
										<option value="General Inquiry">General Inquiry</option>
										<option value="Volunteer">I Want to Volunteer</option>
										<option value="Feedback">Feedback</option>
										<option value="Other">Other</option>
									</select>
								</div>
							</div>

							<div>
								<label
									htmlFor="message"
									className="block text-sm font-medium text-gray-300 mb-1.5"
								>
									Message
								</label>
								<textarea
									id="message"
									name="message"
									required
									value={formData.message}
									onChange={handleChange}
									rows={4}
									className="w-full px-4 py-2.5 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
								/>
							</div>

							<div className="flex justify-end">
								<button
									type="submit"
									disabled={status === "submitting"}
									className={`px-6 py-3 rounded-xl font-semibold text-white transition-all duration-200 ${
										status === "submitting"
											? "bg-gray-600 cursor-not-allowed"
											: "bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
									}`}
								>
									{status === "submitting" ? "Sending..." : "Send Message"}
								</button>
							</div>

							{status === "success" && (
								<motion.div
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									className="p-4 rounded-lg bg-green-500/20 border border-green-500 text-green-400"
								>
									Thanks for reaching out! The committee will get back to you
									soon.
								</motion.div>
							)}

							{status === "error" && (
								<motion.div
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									className="p-4 rounded-lg bg-red-500/20 border border-red-500 text-red-400"
								>
									Something went wrong. Please try again.
								</motion.div>
							)}
						</form>
					</div>
				</motion.div>
			</div>
		</section>
	);
}
