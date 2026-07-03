"use client";

import Image from "next/image";
import QRCode from "react-qr-code";
import { SITE_NAME, SITE_URL, SITE_URL_DISPLAY } from "../config/site";

/**
 * Print-friendly QR poster for the clubhouse bulletin board.
 * On screen it shows a dark preview with a print button; when printed
 * it renders as a clean black-on-white flyer.
 */
export default function QrPosterPage() {
	return (
		<div className="min-h-screen flex flex-col items-center py-10 print:py-0">
			{/* Screen-only helper bar */}
			<div className="print:hidden mb-8 text-center">
				<h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
					Clubhouse QR Poster
				</h1>
				<p className="text-gray-400 mb-5 max-w-md mx-auto">
					Print this page and pin it up at the clubhouse so neighbors can find
					the site by scanning the code.
				</p>
				<button
					onClick={() => window.print()}
					className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold hover:from-purple-600 hover:to-pink-700 transition-all duration-200"
				>
					Print This Page
				</button>
			</div>

			{/* The poster itself — white card on screen, full page in print */}
			<div className="bg-white text-gray-900 rounded-3xl print:rounded-none shadow-2xl print:shadow-none w-full max-w-xl px-8 py-12 md:px-14 md:py-14 text-center print:max-w-none print:min-h-screen print:flex print:flex-col print:justify-center">
				<div className="flex items-center justify-center gap-3 mb-4">
					<Image
						src="/logo.png"
						alt="Woodward Bluffs Activities Committee logo"
						width={56}
						height={56}
						className="rounded-full"
					/>
					<span className="text-4xl font-extrabold tracking-tight">
						{SITE_NAME}
					</span>
				</div>

				<h2 className="text-2xl md:text-3xl font-bold mb-3">
					What&apos;s happening at Woodward Bluffs?
				</h2>
				<p className="text-lg text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
					Scan the code with your phone&apos;s camera to see upcoming community
					events, RSVP, and share your ideas with the Activities Committee.
				</p>

				<div className="flex justify-center mb-8">
					<div className="p-5 border-4 border-gray-900 rounded-2xl">
						<QRCode
							value={SITE_URL}
							size={280}
							bgColor="#ffffff"
							fgColor="#111111"
							aria-label={`QR code linking to ${SITE_URL_DISPLAY}`}
						/>
					</div>
				</div>

				<p className="text-xl font-bold tracking-wide">{SITE_URL_DISPLAY}</p>
				<p className="text-gray-500 mt-3">
					Woodward Bluffs Mobile Home Park &middot; Activities Committee
				</p>
			</div>
		</div>
	);
}
