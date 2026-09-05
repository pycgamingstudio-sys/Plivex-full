import nodemailer from "npm:nodemailer@6.9.10";
import { secrets } from "base44:runtime";

export function resolveGmailCredentials(overrideEmail, overridePass) {
  const user = (overrideEmail || secrets.get("GMAIL_USER") || "").trim();
  const pass = (overridePass || secrets.get("GMAIL_PASS") || "").trim();
  return { user, pass };
}

export async function sendGmail({ to, subject, html, senderEmail, appPassword, attachments }) {
  const { user, pass } = resolveGmailCredentials(senderEmail, appPassword);
  if (!user || !pass) {
    throw new Error("Gmail credentials not configured. Set GMAIL_USER and GMAIL_PASS in workspace secrets, or enter them in Settings → Auto-Reminder & Email Settings.");
  }
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
  return transporter.sendMail({
    from: `Plivex Support <${user}>`,
    to,
    subject,
    html,
    attachments: attachments || [],
  });
}