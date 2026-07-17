// Shared smooth-scroll for section navigation. When called from a page
// other than the home page, navigates home with the section hash instead.
export function scrollToSection(id: string, pathname?: string | null) {
	if (pathname && pathname !== "/") {
		window.location.href = id === "top" ? "/" : `/#${id}`;
		return;
	}
	if (id === "top") {
		window.scrollTo({ top: 0, behavior: "smooth" });
		return;
	}
	document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}
