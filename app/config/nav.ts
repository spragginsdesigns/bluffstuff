export interface NavLink {
	id: string;
	label: string;
}

// Single source of truth for section navigation. Consumed by NavBar,
// MobileTabBar, and Footer so every surface offers the same destinations.
export const NAV_LINKS: NavLink[] = [
	{ id: "events", label: "Events" },
	{ id: "calendar", label: "Calendar" },
	{ id: "committee", label: "Committee" },
	{ id: "contact", label: "Contact" }
];

// Bottom tab bar ordering — "top" scrolls to the top of the home page.
export const MOBILE_TABS: NavLink[] = [
	{ id: "top", label: "Home" },
	{ id: "events", label: "Events" },
	{ id: "calendar", label: "Calendar" },
	{ id: "contact", label: "Contact" }
];
