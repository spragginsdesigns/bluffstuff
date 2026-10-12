"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Modal from "./ui/Modal";

interface CommitteeGuestListProps {
	eventId: Id<"events">;
	eventTitle: string;
	onClose: () => void;
}

/**
 * The committee's guest list for one event: names, headcount and whatever
 * contact details residents chose to leave. Gated in Convex by the Clerk JWT
 * (`rsvps:listForCommittee`), so outside the committee this is just empty.
 */
export default function CommitteeGuestList({
	eventId,
	eventTitle,
	onClose
}: CommitteeGuestListProps) {
	const guests = useQuery(api.rsvps.listForCommittee, { eventId });
	const headcount = guests?.reduce((sum, g) => sum + g.partySize, 0) ?? 0;

	return (
		<Modal title={`Guests: ${eventTitle}`} onClose={onClose}>
			{guests === undefined ? (
				<div className="flex justify-center py-8">
					<div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
				</div>
			) : guests.length === 0 ? (
				<p className="text-ink-muted text-center py-6">No RSVPs yet.</p>
			) : (
				<>
					<p className="text-base text-ink-muted mb-4">
						{headcount} {headcount === 1 ? "person" : "people"} from{" "}
						{guests.length} {guests.length === 1 ? "RSVP" : "RSVPs"}
					</p>
					<ul className="space-y-2">
						{guests.map((guest) => (
							<li key={guest._id} className="p-3 rounded-xl bg-surface-2">
								<div className="flex items-baseline justify-between gap-3">
									<span className="text-ink font-semibold">{guest.name}</span>
									<span className="text-sm text-ink-muted whitespace-nowrap">
										{guest.partySize === 1
											? "1 person"
											: `${guest.partySize} people`}
									</span>
								</div>
								<div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm">
									{guest.phoneNumber && (
										<a
											href={`tel:${guest.phoneNumber}`}
											className="text-primary-strong underline underline-offset-2"
										>
											{guest.phoneNumber}
										</a>
									)}
									{guest.email && (
										<a
											href={`mailto:${guest.email}`}
											className="text-primary-strong underline underline-offset-2 break-all"
										>
											{guest.email}
										</a>
									)}
									{!guest.phoneNumber && !guest.email && (
										<span className="text-ink-faint">No contact left</span>
									)}
								</div>
								{guest.notes && (
									<p className="text-sm text-ink-muted mt-1">{guest.notes}</p>
								)}
							</li>
						))}
					</ul>
				</>
			)}
		</Modal>
	);
}
