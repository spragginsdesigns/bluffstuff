import "./globals.css";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import UserSync from "./components/UserSync";
import MobileTabBar from "./components/MobileTabBar";
import { Metadata, Viewport } from "next";
import { Fraunces, Atkinson_Hyperlegible } from "next/font/google";
import { Providers } from "./providers";
import { ConvexClientProvider } from "./providers/ConvexClientProdiver";
import { SITE_NAME, SITE_URL } from "./config/site";

const fontDisplay = Fraunces({
	subsets: ["latin"],
	weight: ["600", "700"],
	display: "swap",
	variable: "--font-display"
});

const fontBody = Atkinson_Hyperlegible({
	subsets: ["latin"],
	weight: ["400", "700"],
	display: "swap",
	variable: "--font-body"
});

// Applies the saved (or system) theme before first paint to avoid a flash.
const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("bs-theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}})()`;

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
	// The committee publishes this site, not the park. It is a residents'
	// committee with no authority over park management — don't imply otherwise.
	publisher: "Woodward Bluffs Activities Committee",
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
		statusBarStyle: "default"
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
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#FAF6EF" },
		{ media: "(prefers-color-scheme: dark)", color: "#211C18" }
	]
};

export default function RootLayout({
	children
}: {
	children: React.ReactNode;
}) {
	return (
		<html
			lang="en"
			suppressHydrationWarning
			className={`${fontDisplay.variable} ${fontBody.variable}`}
		>
			<body className="flex flex-col min-h-screen bg-bg text-ink font-sans">
				<script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
				<Providers>
					<ConvexClientProvider>
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
					</ConvexClientProvider>
				</Providers>
			</body>
		</html>
	);
}
