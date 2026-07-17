"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "./ui/Button";
import { scrollToSection } from "../utils/scroll";

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

	return (
		<section id="faq" className="py-12 md:py-16 scroll-mt-20">
			<div className="container mx-auto px-4 max-w-4xl">
				<div className="text-center mb-8 md:mb-12">
					<h2 className="font-display text-3xl md:text-4xl font-semibold text-ink">
						Common Questions
					</h2>
					<p className="text-ink-muted mt-2 text-base md:text-lg">
						Everything you might be wondering about
					</p>
				</div>

				<div className="space-y-3">
					{faqs.map((faq, index) => {
						const isOpen = openIndex === index;
						return (
							<motion.div
								key={index}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.05 }}
								className="bg-surface rounded-xl border border-border overflow-hidden shadow-card"
							>
								<button
									onClick={() => setOpenIndex(isOpen ? null : index)}
									aria-expanded={isOpen}
									className="w-full px-5 py-4 text-left flex justify-between items-center hover:bg-surface-2 transition-colors duration-200"
								>
									<span className="font-semibold text-ink text-base pr-4">
										{faq.question}
									</span>
									<motion.svg
										animate={{ rotate: isOpen ? 180 : 0 }}
										className="w-5 h-5 text-ink-muted flex-shrink-0"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										aria-hidden="true"
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
									{isOpen && (
										<motion.div
											initial={{ height: 0, opacity: 0 }}
											animate={{ height: "auto", opacity: 1 }}
											exit={{ height: 0, opacity: 0 }}
											transition={{ duration: 0.2 }}
											className="overflow-hidden"
										>
											<div className="px-5 py-4 border-t border-border text-ink-muted text-base">
												{faq.answer}
											</div>
										</motion.div>
									)}
								</AnimatePresence>
							</motion.div>
						);
					})}
				</div>

				<div className="mt-10 text-center">
					<p className="text-ink-muted mb-4 text-base">
						Still have questions? We&apos;re here to help!
					</p>
					<Button onClick={() => scrollToSection("contact")}>
						Contact Us
					</Button>
				</div>
			</div>
		</section>
	);
}
