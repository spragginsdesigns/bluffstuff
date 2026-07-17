export interface CommitteeMember {
	name: string;
	role: string;
	description: string;
}

// Single source of truth for the committee roster — rendered on the home
// page (#committee) and in the CommitteeDashboard "Committee" tab.
export const COMMITTEE_MEMBERS: CommitteeMember[] = [
	{
		name: "Kathy",
		role: "Committee Leader",
		description:
			"Leads the Activities Committee and organizes community events"
	},
	{
		name: "Austin Spraggins",
		role: "Treasurer",
		description: "Manages the budget so we can throw the best events possible"
	},
	{
		name: "Kim Anderson",
		role: "Committee Member",
		description: "Helps coordinate events and community outreach"
	},
	{
		name: "Donnalee",
		role: "Committee Member",
		description: "Our go-to helper — always stepping up wherever she's needed"
	}
];
