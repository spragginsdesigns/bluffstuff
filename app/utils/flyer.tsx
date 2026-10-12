import { ImageResponse } from "next/og";
import qrcode from "qrcode-generator";
import { SITE_URL, SITE_URL_DISPLAY } from "../config/site";

// Letter paper at 150 DPI - prints crisp on a home/office printer.
const FLYER_WIDTH = 1275;
const FLYER_HEIGHT = 1650;
// The bottom of every flyer is the same code-drawn "how to use the
// website" panel; the event design gets the space above it.
const FOOTER_HEIGHT = 450;
const TOP_HEIGHT = FLYER_HEIGHT - FOOTER_HEIGHT;

// Poster palette: loud orange frame + black type, matches the committee's
// hand-made flyers and reads from across a room.
const ACCENT = "#f4490c";
const INK = "#0a0a0a";
// Footer colors stay dark so the panel survives black-and-white printing
const FOOTER_GREEN = "#1b5e3e";
const FOOTER_RED = "#b3261e";

export interface FlyerEventData {
	_id: string; // the QR opens /events/<_id>
	title: string;
	description: string;
	date: string; // YYYY-MM-DD
	time: string;
	location: string;
	priceCents?: number;
	imageUrl?: string; // AI poster (JPEG) or legacy background art (PNG)
}

/**
 * Build an SVG path for a QR code. Satori can't render component libraries
 * like react-qr-code (forwardRef), but it renders plain <svg><path/> fine.
 * Level Q survives a smudged or creased print better than M.
 */
function buildQrPath(text: string): { d: string; moduleCount: number } {
	const qr = qrcode(0, "Q");
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
				padding: "8px 44px",
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
 * Code-drawn event design, used until an AI poster exists (or when one
 * failed proofreading). Legacy PNG background art is faded behind it.
 */
function GeneratedTop({
	event,
	artData
}: {
	event: FlyerEventData;
	artData: ArrayBuffer | null;
}) {
	const eventDate = parseEventDate(event.date);
	const weekday = eventDate
		.toLocaleDateString("en-US", { weekday: "long" })
		.toUpperCase();
	const monthDay = eventDate
		.toLocaleDateString("en-US", { month: "long", day: "numeric" })
		.toUpperCase();

	const title = event.title.toUpperCase();
	const titleSize = title.length <= 14 ? 130 : title.length <= 26 ? 100 : 76;

	const rawLocation = event.location.toUpperCase();
	const location = rawLocation.startsWith("AT ")
		? rawLocation
		: `AT ${rawLocation}`;

	const price =
		event.priceCents && event.priceCents > 0
			? `${(event.priceCents / 100).toLocaleString("en-US", {
					style: "currency",
					currency: "USD",
					minimumFractionDigits: event.priceCents % 100 === 0 ? 0 : 2
				})} PER PERSON`
			: null;

	const description =
		event.description.length > 160
			? `${event.description.slice(0, 160).trimEnd()}…`
			: event.description;

	return (
		<div
			style={{
				display: "flex",
				width: FLYER_WIDTH,
				height: TOP_HEIGHT,
				backgroundColor: ACCENT,
				padding: "26px 26px 0 26px"
			}}
		>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					width: "100%",
					height: "100%",
					backgroundColor: "#ffffff",
					borderRadius: "22px 22px 0 0",
					padding: "28px 50px",
					position: "relative",
					overflow: "hidden"
				}}
			>
				{/* Optional legacy background art, faded under a white wash so
				    the type always stays readable */}
				{artData && (
					// eslint-disable-next-line @next/next/no-img-element -- satori template, next/image can't render here
					<img
						// satori accepts raw image bytes as src
						src={artData as unknown as string}
						alt=""
						width={FLYER_WIDTH - 52}
						height={TOP_HEIGHT - 26}
						style={{
							position: "absolute",
							top: 0,
							left: 0,
							width: FLYER_WIDTH - 52,
							height: TOP_HEIGHT - 26,
							objectFit: "cover"
						}}
					/>
				)}
				{artData && (
					<div
						style={{
							position: "absolute",
							top: 0,
							left: 0,
							// Sized like the art, not "100%", which satori resolves
							// to the padded content box and leaves a strip unwashed
							width: FLYER_WIDTH - 52,
							height: TOP_HEIGHT - 26,
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
						padding: "14px 48px",
						marginTop: 24,
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
						gap: 14,
						marginTop: 24
					}}
				>
					<PosterBox fontSize={60}>{weekday}</PosterBox>
					<div style={{ display: "flex", gap: 14 }}>
						<PosterBox fontSize={76}>{monthDay}</PosterBox>
						<PosterBox fontSize={76}>{event.time.toUpperCase()}</PosterBox>
					</div>
				</div>

				{/* Location */}
				<div
					style={{
						fontFamily: "Poppins",
						fontWeight: 700,
						fontSize: 40,
						letterSpacing: 3,
						color: INK,
						marginTop: 22,
						backgroundColor: "rgba(255,255,255,0.88)",
						borderRadius: 18,
						padding: "4px 28px"
					}}
				>
					{location}
				</div>

				{price && (
					<div
						style={{
							fontFamily: "Poppins",
							fontWeight: 700,
							fontSize: 44,
							color: "#ffffff",
							backgroundColor: INK,
							borderRadius: 18,
							padding: "6px 36px",
							marginTop: 16
						}}
					>
						{price}
					</div>
				)}

				{/* Description */}
				<div
					style={{
						display: "flex",
						justifyContent: "center",
						marginTop: 16
					}}
				>
					<div
						style={{
							fontFamily: "Poppins",
							fontSize: 32,
							lineHeight: 1.35,
							color: "#27272a",
							textAlign: "center",
							maxWidth: 980,
							backgroundColor: "rgba(255,255,255,0.88)",
							borderRadius: 18,
							padding: "6px 28px"
						}}
					>
						{description}
					</div>
				</div>
			</div>
		</div>
	);
}

/** One numbered step in the footer instructions. */
function Step({ n, children }: { n: string; children: string }) {
	return (
		<div style={{ display: "flex", alignItems: "center", marginTop: 8 }}>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					width: 46,
					height: 46,
					borderRadius: 23,
					backgroundColor: FOOTER_GREEN,
					color: "#ffffff",
					fontFamily: "Poppins",
					fontWeight: 700,
					fontSize: 28
				}}
			>
				{n}
			</div>
			<div
				style={{
					fontFamily: "Poppins",
					fontSize: 33,
					color: INK,
					marginLeft: 16
				}}
			>
				{children}
			</div>
		</div>
	);
}

/**
 * The fixed bottom panel on every flyer: a large QR code plus plain-English
 * steps for residents who have never scanned one, the typed address as a
 * fallback, and why the site is worth visiting. Never AI-drawn - an
 * AI-rendered QR does not scan.
 *
 * The QR opens this event's own page, so a scan lands one tap from RSVP
 * instead of at the top of a list. Echo's bluff_event.py verify decodes the
 * QR and expects exactly this URL - change both together.
 */
function HowToFooter({ eventId }: { eventId: string }) {
	const { d: qrPath, moduleCount } = buildQrPath(
		`${SITE_URL}/events/${eventId}`
	);
	// 4-module quiet zone around the code, as the QR spec requires
	const quiet = 4;
	const span = moduleCount + quiet * 2;

	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				width: FLYER_WIDTH,
				height: FOOTER_HEIGHT,
				backgroundColor: "#ffffff",
				borderTop: `8px solid ${INK}`,
				padding: "0 40px 0 30px"
			}}
		>
			<svg width={390} height={390} viewBox={`${-quiet} ${-quiet} ${span} ${span}`}>
				<rect x={-quiet} y={-quiet} width={span} height={span} fill="#ffffff" />
				<path d={qrPath} fill={INK} />
			</svg>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					marginLeft: 30,
					// Explicit width: satori only wraps text in a sized box
					width: FLYER_WIDTH - 30 - 390 - 30 - 40
				}}
			>
				<div
					style={{
						fontFamily: "Poppins",
						fontWeight: 700,
						fontSize: 46,
						lineHeight: 1.1,
						color: INK
					}}
				>
					RSVP FOR THIS EVENT
				</div>
				<Step n="1">{"Open your phone's camera."}</Step>
				<Step n="2">Point it at the black square.</Step>
				<Step n="3">Tap the link that pops up.</Step>
				<div
					style={{
						fontFamily: "Poppins",
						fontSize: 25,
						color: INK,
						marginTop: 10
					}}
				>
					No camera? Type this in any web browser:
				</div>
				<div
					style={{
						fontFamily: "Poppins",
						fontWeight: 700,
						fontSize: 46,
						lineHeight: 1.15,
						color: FOOTER_RED
					}}
				>
					{SITE_URL_DISPLAY}
				</div>
				<div
					style={{
						fontFamily: "Poppins",
						fontWeight: 700,
						fontSize: 24,
						lineHeight: 1.3,
						color: INK,
						borderTop: `3px solid ${INK}`,
						paddingTop: 8,
						marginTop: 6
					}}
				>
					No account needed. RSVP, pay online, get a reminder.
				</div>
			</div>
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

	// Fetch the art ourselves and hand satori the raw bytes - satori's own
	// remote-image loading silently drops the layer. The stored content type
	// says what it is: AI posters are saved as JPEG (app/utils/flyerPoster.ts),
	// while older gpt-image-2 background art was saved as PNG. Telling them
	// apart this way avoids a Convex schema change.
	let artData: ArrayBuffer | null = null;
	let isPoster = false;
	if (event.imageUrl) {
		try {
			const artRes = await fetch(event.imageUrl, { cache: "no-store" });
			if (artRes.ok) {
				artData = await artRes.arrayBuffer();
				isPoster = (artRes.headers.get("content-type") ?? "").includes("jpeg");
			}
		} catch {
			// Art is decoration - render the code-drawn flyer rather than fail
		}
	}

	return new ImageResponse(
		(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					flexDirection: "column",
					backgroundColor: "#ffffff"
				}}
			>
				{isPoster && artData ? (
					// eslint-disable-next-line @next/next/no-img-element -- satori template, next/image can't render here
					<img
						src={artData as unknown as string}
						alt=""
						width={FLYER_WIDTH}
						height={TOP_HEIGHT}
						style={{
							width: FLYER_WIDTH,
							height: TOP_HEIGHT,
							objectFit: "cover"
						}}
					/>
				) : (
					<GeneratedTop event={event} artData={artData} />
				)}
				<HowToFooter eventId={event._id} />
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
