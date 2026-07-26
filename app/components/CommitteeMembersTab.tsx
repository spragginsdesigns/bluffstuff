"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { COMMITTEE_MEMBERS } from "../data/committee";

/** The roster, plus the admin bootstrap link. */
export default function CommitteeMembersTab() {
	return (
		<div>
			<h3 className="text-xl font-semibold text-ink mb-6">Committee Members</h3>

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				{COMMITTEE_MEMBERS.map((member, index) => (
					<motion.div
						key={member.name}
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: index * 0.1 }}
						className="p-4 rounded-xl bg-surface-2 border border-border"
					>
						<div className="flex items-center gap-3 mb-2">
							<div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-fg font-bold flex-shrink-0">
								{member.name.charAt(0)}
							</div>
							<div>
								<h4 className="text-ink font-medium">{member.name}</h4>
								<p className="text-primary-strong text-sm">{member.role}</p>
							</div>
						</div>
						<p className="text-ink-muted text-sm">{member.description}</p>
					</motion.div>
				))}
			</div>

			<div className="mt-6 p-4 rounded-xl bg-surface-2 border border-border">
				<h4 className="text-ink font-medium mb-1">Roster changes</h4>
				<p className="text-ink-muted text-sm">
					The roster above is set in code (
					<code className="text-ink-faint">app/data/committee.ts</code>). To give
					someone the committee role on the site, use the{" "}
					<Link
						href="/admin/seed"
						className="text-primary-strong hover:underline"
					>
						seed page
					</Link>
					.
				</p>
			</div>
		</div>
	);
}
