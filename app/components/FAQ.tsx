"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FAQItem {
	question: string;
	answer: string;
}

const faqs: FAQItem[] = [
	{
		question: "When are committee meetings?",
		answer:
			"The Activities Committee meets on the first Monday of every month. Everyone is welcome to attend and share ideas for community events!"
	},
	{
		question: "How do I RSVP for an event?",
		answer:
			"Simply click the 'RSVP Now' button on any event card. Fill in your info and you're all set! You can even add the event to your phone's calendar."
	},
	{
		question: "How can I suggest an event?",
		answer:
			"Use the Contact Us form below to send us your event idea. We love hearing suggestions from the community!"
	},
	{
		question: "How do I join the Activities Committee?",
		answer:
			"We're always looking for enthusiastic residents to join! Come to a committee meeting on the first Monday of the month, or reach out through our contact form. The more the merrier!"
	},
	{
		question: "What types of events do you organize?",
		answer:
			"Everything from potlucks and cook-offs to holiday celebrations, game nights, and seasonal parties. If the community wants it, we'll make it happen!"
	},
	{
		question: "Are events free for residents?",
		answer:
			"Most community events are free or ask for a small potluck contribution. The Activities Committee uses community funds for supplies and decorations."
	}
];

export default function FAQ() {
	const [openIndex, setOpenIndex] = useState<number | null>(null);

	const scrollToContact = () => {
		document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
	};

	return (
		<section id="faq" className="py-12 md:py-16 bg-gradient-to-br from-gray-900 to-gray-800">
			<div className="container mx-auto px-4 max-w-4xl">
				<h2 className="text-2xl md:text-3xl font-bold mb-8 md:mb-12 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
					Frequently Asked Questions
				</h2>

				<div className="space-y-3">
					{faqs.map((faq, index) => (
						<motion.div
							key={index}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.05 }}
							className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden"
						>
							<button
								onClick={() =>
									setOpenIndex(openIndex === index ? null : index)
								}
								className="w-full px-5 py-4 text-left flex justify-between items-center hover:bg-gray-700/30 transition-colors duration-200"
							>
								<span className="font-semibold text-gray-100 text-sm md:text-base pr-4">
									{faq.question}
								</span>
								<motion.svg
									animate={{ rotate: openIndex === index ? 180 : 0 }}
									className="w-5 h-5 text-gray-400 flex-shrink-0"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M19 9l-7 7-7-7"
									/>
								</motion.svg>
							</button>

							<AnimatePresence>
								{openIndex === index && (
									<motion.div
										initial={{ height: 0, opacity: 0 }}
										animate={{ height: "auto", opacity: 1 }}
										exit={{ height: 0, opacity: 0 }}
										transition={{ duration: 0.2 }}
										className="overflow-hidden"
									>
										<div className="px-5 py-4 border-t border-gray-700 text-gray-400 text-sm md:text-base">
											{faq.answer}
										</div>
									</motion.div>
								)}
							</AnimatePresence>
						</motion.div>
					))}
				</div>

				<div className="mt-10 text-center">
					<p className="text-gray-400 mb-4 text-sm md:text-base">
						Still have questions? We&apos;re here to help!
					</p>
					<button
						onClick={scrollToContact}
						className="bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25"
					>
						Contact Us
					</button>
				</div>
			</div>
		</section>
	);
}
