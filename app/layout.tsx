import "./globals.css";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import UserSync from "./components/UserSync";
import { Metadata } from "next";
import { Providers } from "./providers";
import { ConvexClientProvider } from "./providers/ConvexClientProdiver";

export const metadata: Metadata = {
	title: "Woodward Bluffs Mobile Home Park Activities Committee",
	description:
		"Official website for the Woodward Bluffs Mobile Home Park Activities Committee. Find information about community events, activities, and get involved in your neighborhood.",
	keywords: [
		"Woodward Bluffs",
		"Mobile Home Park",
		"Activities",
		"Community Events",
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
		title: "Bluff Stuff"
	},
	manifest: "/site.webmanifest",
	metadataBase: new URL("https://www.woodwardbluffsactivities.com"),
	openGraph: {
		title: "Woodward Bluffs Mobile Home Park Activities Committee",
		description:
			"Join us for community events and activities at Woodward Bluffs Mobile Home Park",
		url: "https://bluffstuff.vercel.app/",
		siteName: "Woodward Bluffs Activities",
		images: [
			{
				url: "https://opengraph.b-cdn.net/production/images/d4f057e8-d380-4c20-b7f2-eb7cfa9a9829.jpg?token=QtP06HYSWJCx816f5EeTMbirREVrw-fZuZQUw4t96CM&height=836&width=1200&expires=33259069873",
				width: 1200,
				height: 836
			}
		],
		locale: "en_US",
		type: "website"
	},
	twitter: {
		card: "summary_large_image",
		title: "Woodward Bluffs Mobile Home Park Activities Committee",
		description:
			"Join us for community events and activities at Woodward Bluffs Mobile Home Park",
		images: [
			"https://opengraph.b-cdn.net/production/images/d4f057e8-d380-4c20-b7f2-eb7cfa9a9829.jpg?token=QtP06HYSWJCx816f5EeTMbirREVrw-fZuZQUw4t96CM&height=836&width=1200&expires=33259069873"
		]
	}
};

export const viewport = {
	colorScheme: "dark"
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
						<header className="fixed w-full top-0 z-50">
							<NavBar />
						</header>
						<main className="flex-grow mt-16">
							<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
								{children}
							</div>
						</main>
						<Footer />
					</Providers>
				</ConvexClientProvider>
			</body>
		</html>
	);
}
