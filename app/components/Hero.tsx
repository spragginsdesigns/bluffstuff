"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function Hero() {
	const scrollTo = (id: string) => {
		document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
	};

	return (
		<section className="relative w-full overflow-hidden pt-20 pb-12 md:pt-24 md:pb-16">
			{/* Subtle background gradient orbs */}
			<div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
			<div className="absolute bottom-10 right-10 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl" />

			<div className="container mx-auto px-4 h-full flex flex-col lg:flex-row items-center justify-center relative z-10">
				{/* Left Column */}
				<div className="w-full lg:w-1/2 text-center lg:text-left mb-10 lg:mb-0">
					<motion.h1
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6 }}
						className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600"
					>
						Welcome to Bluff Stuff
					</motion.h1>
					<motion.p
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.1 }}
						className="text-lg md:text-xl lg:text-2xl mb-10 text-gray-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
					>
						Your gateway to the vibrant{" "}
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 font-semibold">
							Woodward Bluffs community
						</span>
					</motion.p>
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.2 }}
						className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
					>
						<button
							onClick={() => scrollTo("events")}
							className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-3 px-8 rounded-xl text-lg transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25"
						>
							See What&apos;s Happening
						</button>
						<button
							onClick={() => scrollTo("faq")}
							className="bg-white/5 backdrop-blur-sm border border-white/10 text-white font-bold py-3 px-8 rounded-xl text-lg hover:bg-white/10 transition-all duration-300"
						>
							Learn More
						</button>
					</motion.div>
				</div>

				{/* Right Column */}
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.7, delay: 0.2 }}
					className="w-full lg:w-1/2 flex justify-center items-center"
				>
					<div className="relative w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96">
						<div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-pink-600/30 rounded-full blur-2xl animate-pulse" />
						<div className="relative w-full h-full rounded-full overflow-hidden border-2 border-white/10 shadow-2xl shadow-purple-500/10">
							<Image
								src="/logo.png"
								alt="Woodward Bluffs Activities Committee Logo"
								fill
								style={{ objectFit: "cover" }}
								priority
								className="rounded-full"
							/>
						</div>
					</div>
				</motion.div>
			</div>
		</section>
	);
}
