import "./globals.css";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import UserSync from "./components/UserSync";
import MobileTabBar from "./components/MobileTabBar";
import { Metadata, Viewport } from "next";
import { Providers } from "./providers";
import { ConvexClientProvider } from "./providers/ConvexClientProdiver";
import { SITE_NAME, SITE_URL } from "./config/site";

const SITE_DESCRIPTION =
	"See what's happening at Woodward Bluffs Mobile Home Park — community events, potlucks, and get-togethers. RSVP in seconds, add events to your calendar, and share your ideas with the Activities Committee.";

export const metadata: Metadata = {
	title: `${SITE_NAME} — What's Happening at Woodward Bluffs`,
	description: SITE_DESCRIPTION,
	keywords: [
		"Woodward Bluffs",
		"Mobile Home Park",
		"Activities Committee",
		"Community Events",
		"Fresno",
		"Neighborhood"
	],
	authors: [{ name: "Woodward Bluffs Activities Committee" }],
	creator: "Woodward Bluffs Activities Committee",
	publisher: "Woodward Bluffs Mobile Home Park",
	formatDetection: {
		email: false,
		address: false,
		telephone: false
	},
	icons: {
		icon: [
			{ url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" }
		],
		shortcut: [{ url: "/favicon.ico" }],
		apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
		other: [
			{ rel: "icon", type: "image/svg+xml", url: "/favicon.svg" }
		]
	},
	appleWebApp: {
		title: SITE_NAME,
		statusBarStyle: "black-translucent"
	},
	manifest: "/site.webmanifest",
	metadataBase: new URL(SITE_URL),
	openGraph: {
		title: `${SITE_NAME} — What's Happening at Woodward Bluffs`,
		description: SITE_DESCRIPTION,
		url: SITE_URL,
		siteName: SITE_NAME,
		images: [
			{
				url: "/logo.png",
				width: 500,
				height: 500,
				alt: "Woodward Bluffs Activities Committee logo"
			}
		],
		locale: "en_US",
		type: "website"
	},
	twitter: {
		card: "summary",
		title: `${SITE_NAME} — What's Happening at Woodward Bluffs`,
		description: SITE_DESCRIPTION,
		images: ["/logo.png"]
	}
};

export const viewport: Viewport = {
	colorScheme: "dark",
	themeColor: "#131111"
};

export default function RootLayout({
	children
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body className="flex flex-col min-h-screen bg-[#131111] text-white">
				<ConvexClientProvider>
					<Providers>
						<UserSync />
						<header className="fixed w-full top-0 z-50 print:hidden">
							<NavBar />
						</header>
						<main className="flex-grow mt-16 print:mt-0">
							<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
								{children}
							</div>
						</main>
						<div className="print:hidden">
							<Footer />
							{/* Spacer so the mobile tab bar doesn't cover the footer */}
							<div className="h-16 md:hidden" aria-hidden />
							<MobileTabBar />
						</div>
					</Providers>
				</ConvexClientProvider>
			</body>
		</html>
	);
}
