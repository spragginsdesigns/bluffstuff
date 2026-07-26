"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { api } from "@/convex/_generated/api";
import { useIsCommittee } from "../hooks/useIsCommittee";
import CommitteeOverview from "../components/CommitteeOverview";
import CommitteeEventsTab from "../components/CommitteeEventsTab";
import CommitteeFeedbackTab from "../components/CommitteeFeedbackTab";
import CommitteeIdeasTab from "../components/CommitteeIdeasTab";
import CommitteeMessagesTab from "../components/CommitteeMessagesTab";
import CommitteeMembersTab from "../components/CommitteeMembersTab";
import Button from "../components/ui/Button";

type AdminTab = "events" | "feedback" | "ideas" | "messages" | "members";

/**
 * The committee's admin dashboard, on its own route.
 *
 * Clerk middleware already requires a sign-in to reach `/admin`; the role check
 * here keeps signed-in residents out of the UI. It is not the security
 * boundary — every committee query is gated in Convex and every write goes
 * through the secret-gated API route, so a resident who forced their way to
 * this page would see empty tabs and failed writes.
 */
export default function AdminDashboardPage() {
	const { isCommittee, isLoaded, isSignedIn, user } = useIsCommittee();
	const allEvents = useQuery(api.events.listAll);
	// Identity flows through the Clerk JWT — no client-supplied email
	const contactMessages = useQuery(api.contactMessages.list, {});

	const [activeTab, setActiveTab] = useState<AdminTab>("events");

	if (!isLoaded) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
			</div>
		);
	}

	if (!isSignedIn || !isCommittee) {
		return (
			<div className="min-h-screen flex items-center justify-center px-4">
				<div className="bg-surface rounded-2xl border border-border shadow-card p-8 max-w-md w-full text-center">
					<h1 className="font-display text-2xl font-bold text-ink mb-2">
						Committee members only
					</h1>
					<p className="text-ink-muted text-base mb-6 leading-relaxed">
						This area is for the activities committee. If you think you should
						have access, get in touch and we&apos;ll sort it out.
					</p>
					<Link href="/">
						<Button className="w-full">Back to the Bluffs</Button>
					</Link>
				</div>
			</div>
		);
	}

	// The badge counts messages still waiting on a reply, not the total —
	// a number that never goes down stops being a signal.
	const unreadMessages = contactMessages?.filter((m) => !m.isRead).length;

	const tabs: { id: AdminTab; label: string; badge?: number }[] = [
		{ id: "events", label: "Manage Events" },
		{ id: "feedback", label: "Turnout & Feedback" },
		{ id: "ideas", label: "Ideas" },
		{ id: "messages", label: "Messages", badge: unreadMessages },
		{ id: "members", label: "Committee" }
	];

	return (
		<main className="min-h-screen py-8 md:py-12">
			<div className="container mx-auto px-4 max-w-6xl">
				<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
					<div>
						<h1 className="font-display text-2xl md:text-3xl font-semibold text-ink">
							Committee Dashboard
						</h1>
						<p className="text-ink-muted text-base mt-1">
							Signed in as {user?.primaryEmailAddress?.emailAddress}
						</p>
					</div>
					<Link href="/" className="text-primary-strong hover:underline text-sm">
						View the public site &rarr;
					</Link>
				</div>

				<CommitteeOverview
					events={allEvents}
					messageCount={contactMessages?.length}
					onGoToFeedback={() => setActiveTab("feedback")}
				/>

				{/* Tabs - horizontal scroll on mobile */}
				<div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
					{tabs.map(({ id, label, badge }) => (
						<motion.button
							key={id}
							whileTap={{ scale: 0.95 }}
							onClick={() => setActiveTab(id)}
							className={`px-5 py-2.5 rounded-full font-medium transition-colors duration-200 whitespace-nowrap text-sm md:text-base
                ${
									activeTab === id
										? "bg-primary text-primary-fg"
										: "bg-surface-2 text-ink-muted hover:text-ink"
								}`}
						>
							{label}
							{badge !== undefined && badge > 0 && (
								<span
									className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
										activeTab === id
											? "bg-primary-fg/20"
											: "bg-primary-soft text-primary-strong"
									}`}
								>
									{badge}
								</span>
							)}
						</motion.button>
					))}
				</div>

				<div className="bg-surface rounded-xl p-4 md:p-6 border border-border shadow-card">
					{activeTab === "events" && <CommitteeEventsTab events={allEvents} />}
					{activeTab === "feedback" && (
						<CommitteeFeedbackTab events={allEvents ?? []} />
					)}
					{activeTab === "ideas" && <CommitteeIdeasTab />}
					{activeTab === "messages" && (
						<CommitteeMessagesTab messages={contactMessages} />
					)}
					{activeTab === "members" && <CommitteeMembersTab />}
				</div>
			</div>
		</main>
	);
}
