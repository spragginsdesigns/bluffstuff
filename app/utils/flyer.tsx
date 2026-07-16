import { ImageResponse } from "next/og";
import qrcode from "qrcode-generator";
import { SITE_URL, SITE_URL_DISPLAY } from "../config/site";

// Letter paper at 150 DPI — prints crisp on a home/office printer.
const FLYER_WIDTH = 1275;
const FLYER_HEIGHT = 1650;

// Poster palette: loud orange frame + black type, matches the committee's
// hand-made flyers and reads from across a room.
const ACCENT = "#f4490c";
const INK = "#0a0a0a";

export interface FlyerEventData {
	title: string;
	description: string;
	date: string; // YYYY-MM-DD
	time: string;
	location: string;
	imageUrl?: string; // optional background art, composited behind the boxes
}

/**
 * Build an SVG path for a QR code. Satori can't render component libraries
 * like react-qr-code (forwardRef), but it renders plain <svg><path/> fine.
 */
function buildQrPath(text: string): { d: string; moduleCount: number } {
	const qr = qrcode(0, "M");
	qr.addData(text);
	qr.make();
	const moduleCount = qr.getModuleCount();
	let d = "";
	for (let row = 0; row < moduleCount; row++) {
		for (let col = 0; col < moduleCount; col++) {
			if (qr.isDark(row, col)) {
				d += `M${col},${row}h1v1h-1z`;
			}
		}
	}
	return { d, moduleCount };
}

/** Parse "YYYY-MM-DD" into a local Date without timezone drift. */
function parseEventDate(dateStr: string): Date {
	const [year, month, day] = dateStr.split("-").map(Number);
	return new Date(year, month - 1, day);
}

/** Format "YYYY-MM-DD" as e.g. "Saturday, August 9, 2026". */
export function formatFlyerDate(dateStr: string): string {
	return parseEventDate(dateStr).toLocaleDateString("en-US", {
		weekday: "long",
		month: "long",
		day: "numeric",
		year: "numeric"
	});
}

/** A stacked poster box: thick black outline, white fill, Anton display type. */
function PosterBox({
	children,
	fontSize
}: {
	children: string;
	fontSize: number;
}) {
	return (
		<div
			style={{
				display: "flex",
				justifyContent: "center",
				border: `7px solid ${INK}`,
				borderRadius: 26,
				backgroundColor: "#ffffff",
				padding: "10px 48px",
				fontFamily: "Anton",
				fontSize,
				lineHeight: 1.15,
				color: INK,
				textAlign: "center"
			}}
		>
			{children}
		</div>
	);
}

/**
 * Render a print-ready flyer PNG for an event, QR code included.
 * Runs on the edge runtime (Node runtime breaks next/og font loading on
 * Windows dev). Used by the /api/flyer/[eventId] route; the flyer email
 * fetches that route rather than importing this directly.
 */
export async function generateFlyerImage(
	event: FlyerEventData
): Promise<ImageResponse> {
	const [anton, poppins, poppinsBold] = await Promise.all([
		fetch(new URL("../fonts/Anton-Regular.ttf", import.meta.url)).then((r) =>
			r.arrayBuffer()
		),
		fetch(new URL("../fonts/Poppins-Regular.ttf", import.meta.url)).then((r) =>
			r.arrayBuffer()
		),
		fetch(new URL("../fonts/Poppins-Bold.ttf", import.meta.url)).then((r) =>
			r.arrayBuffer()
		)
	]);

	// Fetch background art ourselves and hand satori the raw bytes —
	// satori's own remote-image loading silently drops the layer.
	let artData: ArrayBuffer | null = null;
	if (event.imageUrl) {
		try {
			const artRes = await fetch(event.imageUrl, { cache: "no-store" });
			if (artRes.ok) {
				artData = await artRes.arrayBuffer();
			}
		} catch {
			// Art is decoration — render the flyer without it rather than fail
		}
	}

	const { d: qrPath, moduleCount } = buildQrPath(`${SITE_URL}/#events`);

	const eventDate = parseEventDate(event.date);
	const weekday = eventDate
		.toLocaleDateString("en-US", { weekday: "long" })
		.toUpperCase();
	const monthDay = eventDate
		.toLocaleDateString("en-US", { month: "long", day: "numeric" })
		.toUpperCase();

	const title = event.title.toUpperCase();
	const titleSize = title.length <= 14 ? 150 : title.length <= 26 ? 112 : 84;

	const rawLocation = event.location.toUpperCase();
	const location = rawLocation.startsWith("AT ")
		? rawLocation
		: `AT ${rawLocation}`;

	const description =
		event.description.length > 200
			? `${event.description.slice(0, 200).trimEnd()}…`
			: event.description;

	return new ImageResponse(
		(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					backgroundColor: ACCENT,
					padding: 30
				}}
			>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						width: "100%",
						height: "100%",
						backgroundColor: "#ffffff",
						borderRadius: 24,
						padding: "48px 56px",
						position: "relative",
						overflow: "hidden"
					}}
				>
					{/* Optional background art, faded under a white wash so the
					    type and QR always stay readable */}
					{artData && (
						// eslint-disable-next-line @next/next/no-img-element -- satori template, next/image can't render here
						<img
							// satori accepts raw image bytes as src
							src={artData as unknown as string}
							alt=""
							width={FLYER_WIDTH - 60}
							height={FLYER_HEIGHT - 60}
							style={{
								position: "absolute",
								top: 0,
								left: 0,
								width: FLYER_WIDTH - 60,
								height: FLYER_HEIGHT - 60,
								objectFit: "cover",
								borderRadius: 24
							}}
						/>
					)}
					{artData && (
						<div
							style={{
								position: "absolute",
								top: 0,
								left: 0,
								width: "100%",
								height: "100%",
								background:
									"linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(255,255,255,0.55) 40%, rgba(255,255,255,0.4) 70%, rgba(255,255,255,0.65) 100%)"
							}}
						/>
					)}

					{/* Committee header */}
					<div
						style={{
							fontFamily: "Poppins",
							fontWeight: 700,
							fontSize: 26,
							letterSpacing: 6,
							color: INK
						}}
					>
						WOODWARD BLUFFS ACTIVITIES COMMITTEE
					</div>

					{/* Title */}
					<div
						style={{
							display: "flex",
							justifyContent: "center",
							border: `8px solid ${INK}`,
							borderRadius: 30,
							padding: "18px 52px",
							marginTop: 36,
							fontFamily: "Anton",
							fontSize: titleSize,
							lineHeight: 1.05,
							color: INK,
							textAlign: "center",
							maxWidth: 1080,
							backgroundColor: "#ffffff"
						}}
					>
						{title}
					</div>

					{/* Date / time boxes */}
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							gap: 18,
							marginTop: 34
						}}
					>
						<PosterBox fontSize={72}>{weekday}</PosterBox>
						<div style={{ display: "flex", gap: 18 }}>
							<PosterBox fontSize={88}>{monthDay}</PosterBox>
							<PosterBox fontSize={88}>{event.time.toUpperCase()}</PosterBox>
						</div>
					</div>

					{/* Location */}
					<div
						style={{
							fontFamily: "Poppins",
							fontWeight: 700,
							fontSize: 42,
							letterSpacing: 3,
							color: ACCENT,
							marginTop: 30,
							backgroundColor: "rgba(255,255,255,0.88)",
							borderRadius: 18,
							padding: "4px 28px"
						}}
					>
						{location}
					</div>

					{/* Description */}
					<div
						style={{
							display: "flex",
							justifyContent: "center",
							marginTop: 22
						}}
					>
						<div
							style={{
								fontFamily: "Poppins",
								fontSize: 32,
								lineHeight: 1.4,
								color: "#27272a",
								textAlign: "center",
								maxWidth: 940,
								backgroundColor: "rgba(255,255,255,0.88)",
								borderRadius: 18,
								padding: "10px 32px"
							}}
						>
							{description}
						</div>
					</div>

					{/* Spacer pushes the QR block to the bottom */}
					<div style={{ display: "flex", flexGrow: 1 }} />

					{/* QR + call to action */}
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							gap: 48
						}}
					>
						<div
							style={{
								display: "flex",
								padding: 16,
								border: `7px solid ${INK}`,
								borderRadius: 26,
								backgroundColor: "#ffffff"
							}}
						>
							<svg
								width={300}
								height={300}
								viewBox={`0 0 ${moduleCount} ${moduleCount}`}
							>
								<path d={qrPath} fill={INK} />
							</svg>
						</div>
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								maxWidth: 520,
								backgroundColor: "rgba(255,255,255,0.88)",
								borderRadius: 22,
								padding: "20px 28px"
							}}
						>
							<div
								style={{
									fontFamily: "Anton",
									fontSize: 64,
									color: INK
								}}
							>
								SCAN ME!
							</div>
							<div
								style={{
									fontFamily: "Poppins",
									fontSize: 30,
									lineHeight: 1.35,
									color: "#3f3f46",
									marginTop: 8
								}}
							>
								{"Point your phone's camera at the code to see details and RSVP."}
							</div>
							<div
								style={{
									fontFamily: "Poppins",
									fontWeight: 700,
									fontSize: 36,
									color: ACCENT,
									marginTop: 14
								}}
							>
								{SITE_URL_DISPLAY}
							</div>
						</div>
					</div>
				</div>
			</div>
		),
		{
			width: FLYER_WIDTH,
			height: FLYER_HEIGHT,
			fonts: [
				{ name: "Anton", data: anton, weight: 400, style: "normal" },
				{ name: "Poppins", data: poppins, weight: 400, style: "normal" },
				{ name: "Poppins", data: poppinsBold, weight: 700, style: "normal" }
			]
		}
	);
}
