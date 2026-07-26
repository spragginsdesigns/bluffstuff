"use client";

import { useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import ConfirmButton from "./ui/ConfirmButton";

interface CommitteeMessagesTabProps {
	messages: Doc<"contactMessages">[] | undefined;
}

type MessageFilter = "unread" | "all";

/** Contact form submissions — read, reply, mark handled, delete. */
export default function CommitteeMessagesTab({
	messages
}: CommitteeMessagesTabProps) {
	const setRead = useMutation(api.contactMessages.setRead);
	const removeMessage = useMutation(api.contactMessages.remove);
	const [filter, setFilter] = useState<MessageFilter>("all");
	const [pendingId, setPendingId] = useState<Id<"contactMessages"> | null>(
		null
	);

	const unreadCount = useMemo(
		() => (messages ?? []).filter((m) => !m.isRead).length,
		[messages]
	);

	const visible = useMemo(() => {
		const list = messages ?? [];
		return filter === "unread" ? list.filter((m) => !m.isRead) : list;
	}, [messages, filter]);

	const handleToggleRead = async (msg: Doc<"contactMessages">) => {
		setPendingId(msg._id);
		try {
			await setRead({ id: msg._id, isRead: !msg.isRead });
		} finally {
			setPendingId(null);
		}
	};

	const filters: { id: MessageFilter; label: string; count: number }[] = [
		{ id: "all", label: "All", count: messages?.length ?? 0 },
		{ id: "unread", label: "Needs a reply", count: unreadCount }
	];

	return (
		<div>
			<h3 className="text-xl font-semibold text-ink mb-1">Contact Messages</h3>
			<p className="text-ink-muted text-sm mb-4">
				Mark one handled once you&apos;ve replied — the badge counts what&apos;s
				still outstanding.
			</p>

			<div className="flex gap-1.5 mb-4">
				{filters.map(({ id, label, count }) => (
					<button
						key={id}
						onClick={() => setFilter(id)}
						className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200 ${
							filter === id
								? "bg-primary-soft text-primary-strong"
								: "text-ink-faint hover:text-ink hover:bg-surface-2"
						}`}
					>
						{label}
						<span className="ml-1.5 opacity-70">{count}</span>
					</button>
				))}
			</div>

			{messages === undefined ? (
				<div className="flex justify-center py-8">
					<div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
				</div>
			) : visible.length === 0 ? (
				<p className="text-ink-muted text-center py-8">
					{filter === "unread"
						? "Nothing waiting on a reply. Nice."
						: "No messages yet."}
				</p>
			) : (
				<div className="space-y-3">
					{visible.map((msg) => (
						<div
							key={msg._id}
							className={`p-4 rounded-xl border transition-colors ${
								msg.isRead
									? "bg-surface-2 border-border opacity-70"
									: "bg-surface-2 border-primary/30"
							}`}
						>
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
								<div className="min-w-0 flex items-center gap-2 flex-wrap">
									{!msg.isRead && (
										<span
											className="w-2 h-2 rounded-full bg-primary flex-shrink-0"
											aria-label="Unread"
										/>
									)}
									<span className="text-ink font-medium">{msg.name}</span>
									<a
										href={`mailto:${msg.email}?subject=${encodeURIComponent(
											`Re: ${msg.subject}`
										)}`}
										className="text-ink-faint text-sm hover:text-primary-strong transition-colors"
									>
										{msg.email}
									</a>
									{msg.phone && (
										<a
											href={`tel:${msg.phone}`}
											className="text-ink-faint text-sm hover:text-primary-strong transition-colors"
										>
											{msg.phone}
										</a>
									)}
								</div>
								<span className="text-xs text-ink-faint flex-shrink-0">
									{new Date(msg.createdAt).toLocaleDateString("en-US", {
										month: "short",
										day: "numeric",
										year: "numeric"
									})}
								</span>
							</div>

							<div className="mb-1">
								<span className="text-sm text-primary-strong font-medium">
									{msg.subject}
								</span>
							</div>
							<p className="text-ink-muted text-sm">{msg.message}</p>

							<div className="flex flex-wrap gap-2 mt-3">
								<a
									href={`mailto:${msg.email}?subject=${encodeURIComponent(
										`Re: ${msg.subject}`
									)}`}
									className="px-3 py-1.5 rounded-lg text-sm text-primary-strong bg-primary-soft hover:bg-primary-soft/70 transition-colors"
								>
									Reply
								</a>
								<button
									onClick={() => handleToggleRead(msg)}
									disabled={pendingId === msg._id}
									className="px-3 py-1.5 rounded-lg text-sm text-ink-muted bg-surface hover:bg-surface-2 border border-border transition-colors disabled:opacity-60"
								>
									{msg.isRead ? "Mark unread" : "Mark handled"}
								</button>
								<ConfirmButton
									label="Delete"
									ariaLabel={`Delete message from ${msg.name}`}
									onConfirm={() => removeMessage({ id: msg._id })}
								/>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
