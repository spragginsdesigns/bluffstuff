import { Doc } from "@/convex/_generated/dataModel";
import { formatFlyerDate } from "./flyer";

/**
 * AI-designed flyer posters: gpt-image-2.5-sunburst paints the top of the
 * flyer (art + event text), then a cheap vision model proofreads it before
 * it is saved. The QR / how-to footer is never AI-drawn - `flyer.tsx` renders
 * it in code so it is identical and scannable on every flyer.
 */

const POSTER_MODEL = "gpt-image-2.5-sunburst";
const PROOF_MODEL = "gpt-5.4-mini";
// Matches the poster slot in flyer.tsx (1275x1200) with almost no crop;
// gpt-image sizes must be multiples of 16.
const POSTER_SIZE = "1536x1440";
// One retry. A second miss usually means the text itself is too long to
// letter cleanly, which another roll won't fix.
const MAX_ATTEMPTS = 2;

/** The exact lines the poster must show, in reading order. */
export function posterLines(event: Doc<"events">): string[] {
	const dateLine = formatFlyerDate(event.date)
		// Current-year flyers omit the year on purpose
		.replace(/, \d{4}$/, "")
		.toUpperCase();
	const lines = [
		"WOODWARD BLUFFS ACTIVITIES COMMITTEE",
		event.title.toUpperCase(),
		dateLine,
		`${event.time.toUpperCase()}  •  ${event.location.toUpperCase()}`
	];
	if (event.priceCents && event.priceCents > 0) {
		const dollars = (event.priceCents / 100).toLocaleString("en-US", {
			style: "currency",
			currency: "USD",
			minimumFractionDigits: event.priceCents % 100 === 0 ? 0 : 2
		});
		lines.push(`${dollars} PER PERSON`);
	}
	lines.push(event.description.trim());
	return lines;
}

function buildPrompt(event: Doc<"events">, lines: string[]): string {
	// The house style is fixed so every flyer reads as the same series;
	// only the illustrations follow the event.
	return [
		`Design the upper part of a printed community event flyer, slightly wider than tall.`,
		`Audience: residents of a mobile home park, mostly seniors with weak eyesight.`,
		`Legibility beats decoration: very large, bold, plain sans-serif lettering;`,
		`all lettering in black, very dark green or deep red, or white on a dark badge;`,
		`never yellow, orange or light-colored lettering; never script or handwritten fonts;`,
		`never put text over busy imagery. It must still read clearly when printed in black and white.`,
		`House style: warm, cheerful, festive flat screen-print illustration, cream background,`,
		`thick dark outlines, palette of deep green, tomato red, warm orange and golden yellow.`,
		`Decorate the edges with cheerful illustrations that fit this event: ${event.title}. ${event.description}`,
		`No people's faces.`,
		`Include exactly this text, spelled exactly, in this order, and no other words:`,
		...lines.map((line, i) =>
			i === 0
				? `- small header line at the very top: "${line}"`
				: i === 1
					? `- giant title: "${line}"`
					: `- "${line}"`
		),
		`Keep an empty margin of about 6% on every edge. Do not draw any QR code,`,
		`website address, phone number, year, or any words other than the ones listed.`
	].join("\n");
}

interface Proofread {
	ok: boolean;
	problems: string[];
}

async function proofread(
	jpegBase64: string,
	lines: string[],
	apiKey: string
): Promise<Proofread> {
	const res = await fetch("https://api.openai.com/v1/responses", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model: PROOF_MODEL,
			input: [
				{
					role: "user",
					content: [
						{
							type: "input_text",
							text: [
								"Proofread this flyer. Expected lines:",
								...lines,
								"Ignore letter case, line breaks and bullet/dot style.",
								"Report any expected line that is missing or misspelled, wrong numbers, and any extra words.",
								"Reply JSON."
							].join("\n")
						},
						{
							type: "input_image",
							image_url: `data:image/jpeg;base64,${jpegBase64}`
						}
					]
				}
			],
			text: {
				format: {
					type: "json_schema",
					name: "proof",
					strict: true,
					schema: {
						type: "object",
						additionalProperties: false,
						properties: {
							ok: { type: "boolean" },
							problems: { type: "array", items: { type: "string" } }
						},
						required: ["ok", "problems"]
					}
				}
			}
		})
	});
	if (!res.ok) {
		throw new Error(`Proofread failed: ${res.status} ${await res.text()}`);
	}
	const data: unknown = await res.json();
	const output = (data as { output?: unknown[] }).output ?? [];
	for (const item of output) {
		const message = item as { type?: string; content?: { text?: string }[] };
		const text = message.type === "message" ? message.content?.[0]?.text : undefined;
		if (text) {
			const parsed = JSON.parse(text) as Proofread;
			return { ok: parsed.ok === true, problems: parsed.problems ?? [] };
		}
	}
	throw new Error("Proofread response contained no verdict");
}

export interface PosterResult {
	// ArrayBuffer-backed specifically: that is what fetch's BodyInit accepts
	jpeg: Uint8Array<ArrayBuffer>;
	attempts: number;
}

/**
 * Paints and proofreads a poster. Throws if no attempt passes the proofread,
 * so a misspelled poster never reaches the printer - the flyer falls back to
 * the code-drawn layout instead.
 */
export async function generateFlyerPoster(
	event: Doc<"events">,
	apiKey: string
): Promise<PosterResult> {
	const lines = posterLines(event);
	const prompt = buildPrompt(event, lines);
	let lastProblems: string[] = [];

	for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
		const genRes = await fetch("https://api.openai.com/v1/images/generations", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				model: POSTER_MODEL,
				prompt,
				size: POSTER_SIZE,
				quality: "high",
				// JPEG keeps the stored file ~400KB; flyer.tsx also uses the
				// image/jpeg content type to tell posters from legacy PNG art
				output_format: "jpeg",
				output_compression: 90,
				n: 1
			})
		});
		if (!genRes.ok) {
			throw new Error(
				`Poster generation failed: ${genRes.status} ${await genRes.text()}`
			);
		}
		const genData: unknown = await genRes.json();
		const b64 = (genData as { data?: { b64_json?: string }[] }).data?.[0]
			?.b64_json;
		if (!b64) {
			throw new Error("Poster response contained no image data");
		}

		const verdict = await proofread(b64, lines, apiKey);
		if (verdict.ok) {
			// Uint8Array, not Buffer: Buffer no longer satisfies fetch's BodyInit
			return {
				jpeg: new Uint8Array(Buffer.from(b64, "base64")),
				attempts: attempt
			};
		}
		lastProblems = verdict.problems;
		console.warn(
			`Poster attempt ${attempt} failed proofread: ${verdict.problems.join("; ")}`
		);
	}

	throw new Error(
		`Poster text failed proofreading ${MAX_ATTEMPTS} times: ${lastProblems.join("; ")}`
	);
}
