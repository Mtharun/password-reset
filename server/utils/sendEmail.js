// Sends email via Brevo's transactional email HTTP API (https://api.brevo.com).
//
// Why an HTTP API instead of Nodemailer + raw SMTP? Most free-tier hosts
// (Render's free web services included) block outbound traffic on SMTP
// ports (25/465/587) to prevent spam abuse, which makes Gmail-via-Nodemailer
// hang and eventually time out once deployed, even though it works fine
// locally. Brevo's API talks plain HTTPS (port 443), which is never
// blocked, so this works identically in local dev and in production.
//
// Setup (see server/.env.example / README for the full walkthrough):
//   1. Create a free Brevo account (brevo.com) — no credit card needed.
//   2. Add + verify a sender email (can be your own Gmail address; Brevo
//      emails you a confirmation link).
//   3. Create an API key: SMTP & API -> API Keys -> Generate a new API key.
//   4. Set BREVO_API_KEY and EMAIL_FROM in your .env / host environment.

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

/**
 * Sends an email.
 * @param {{ to: string, subject: string, html: string }} options
 */
async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error("BREVO_API_KEY is not set in environment variables");
  }

  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: {
        name: process.env.EMAIL_FROM_NAME || "Password Reset",
        email: process.env.EMAIL_FROM,
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || `Brevo API responded with status ${res.status}`);
  }

  return res.json();
}

module.exports = sendEmail;
