type BrevoRecipient = {
  email: string;
  name?: string;
};

type BrevoEmailPayload = {
  to: BrevoRecipient[];
  subject: string;
  htmlContent: string;
  textContent?: string;
};

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export async function sendBrevoEmail(payload: BrevoEmailPayload) {
  const apiKey = process.env.BREVO_API_KEY || process.env.BREVO_SMTP_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || "Crochet Masterpiece";

  if (!apiKey) {
    throw new Error("BREVO_API_KEY is missing.");
  }
  if (!senderEmail) {
    throw new Error("BREVO_SENDER_EMAIL is missing.");
  }

  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: payload.to,
      subject: payload.subject,
      htmlContent: payload.htmlContent,
      textContent: payload.textContent || payload.subject,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Brevo send failed: ${body || response.statusText}`);
  }

  return response.json().catch(() => ({}));
}

export async function sendBulkBrevoEmail(
  recipients: BrevoRecipient[],
  subject: string,
  htmlContent: string
) {
  const chunkSize = 50;
  let sent = 0;

  for (let index = 0; index < recipients.length; index += chunkSize) {
    const chunk = recipients.slice(index, index + chunkSize);
    if (!chunk.length) continue;
    await sendBrevoEmail({ to: chunk, subject, htmlContent });
    sent += chunk.length;
  }

  return { sent };
}

