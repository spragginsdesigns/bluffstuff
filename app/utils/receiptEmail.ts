import nodemailer from "nodemailer";

interface ReceiptEmailArgs {
	to: string;
	payerName: string;
	eventTitle: string;
	dateLabel: string; // e.g. "Tuesday, July 21"
	time: string;
	location: string;
	amountLabel: string; // e.g. "$8.00"
	confirmationCode: string;
}

/**
 * Emails the resident their door pass after an online payment.
 * Gmail/Yahoo strip most modern CSS, so the markup is table-based
 * with inline styles only — no flexbox, no external assets.
 */
export async function sendPaymentReceiptEmail(
	args: ReceiptEmailArgs
): Promise<void> {
	const gmailUser = process.env.GMAIL_USER;
	const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
	if (!gmailUser || !gmailAppPassword) {
		throw new Error("Receipt email misconfigured — missing Gmail env vars");
	}

	const {
		to,
		payerName,
		eventTitle,
		dateLabel,
		time,
		location,
		amountLabel,
		confirmationCode
	} = args;

	const detailRow = (label: string, value: string, bold = false) => `
		<tr>
			<td style="padding:6px 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;color:#7d6f63;">${label}</td>
			<td align="right" style="padding:6px 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;color:#3d3229;font-weight:${bold ? "bold" : "600"};">${value}</td>
		</tr>`;

	const html = `<!doctype html>
<html>
<body style="margin:0;padding:0;background-color:#f6efe4;">
	<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6efe4;padding:24px 12px;">
		<tr>
			<td align="center">
				<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5d9c7;">
					<tr>
						<td align="center" style="background-color:#c2643f;padding:20px 24px;">
							<div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:bold;color:#ffffff;">Woodward Bluffs Activities</div>
						</td>
					</tr>
					<tr>
						<td align="center" style="padding:28px 24px 8px 24px;">
							<table role="presentation" cellpadding="0" cellspacing="0">
								<tr>
									<td align="center" style="background-color:#3e7a4e;border-radius:999px;padding:8px 28px;">
										<span style="font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:bold;color:#ffffff;letter-spacing:2px;">&#10003;&nbsp;PAID</span>
									</td>
								</tr>
							</table>
						</td>
					</tr>
					<tr>
						<td align="center" style="padding:16px 24px 4px 24px;">
							<div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;color:#7d6f63;text-transform:uppercase;letter-spacing:2px;">Confirmation code</div>
						</td>
					</tr>
					<tr>
						<td align="center" style="padding:4px 24px 20px 24px;">
							<div style="font-family:'Courier New',Courier,monospace;font-size:44px;font-weight:bold;color:#c2643f;letter-spacing:8px;">${confirmationCode}</div>
						</td>
					</tr>
					<tr>
						<td style="padding:0 32px;">
							<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e5d9c7;padding-top:8px;">
								${detailRow("Name", payerName)}
								${detailRow("Event", eventTitle)}
								${detailRow("When", `${dateLabel} at ${time}`)}
								${detailRow("Where", location)}
								${detailRow("Paid", amountLabel, true)}
							</table>
						</td>
					</tr>
					<tr>
						<td align="center" style="padding:20px 32px 28px 32px;">
							<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5;color:#3d3229;">
								<strong>Show this email at the door</strong> — that's it, you're all set. See you there!
							</div>
						</td>
					</tr>
				</table>
				<div style="max-width:520px;padding:16px 8px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#7d6f63;">
					Sent automatically by the Woodward Bluffs Activities Committee website.
				</div>
			</td>
		</tr>
	</table>
</body>
</html>`;

	const text = [
		`PAID — you're all set!`,
		``,
		`Confirmation code: ${confirmationCode}`,
		``,
		`Name: ${payerName}`,
		`Event: ${eventTitle}`,
		`When: ${dateLabel} at ${time}`,
		`Where: ${location}`,
		`Paid: ${amountLabel}`,
		``,
		`Show this email at the door. See you there!`,
		``,
		`— Woodward Bluffs Activities Committee`
	].join("\n");

	const transporter = nodemailer.createTransport({
		service: "gmail",
		auth: { user: gmailUser, pass: gmailAppPassword }
	});

	const info = await transporter.sendMail({
		from: `"Woodward Bluffs Activities" <${gmailUser}>`,
		to,
		subject: `You're paid! ${eventTitle} — code ${confirmationCode}`,
		text,
		html
	});

	if (info.accepted.length === 0) {
		throw new Error("Receipt email was not accepted by the mail server");
	}
}
