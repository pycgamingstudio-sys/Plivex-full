import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { sendGmail } from "../../shared/mailer.ts";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { to, clientName, invoiceNumber, amount, dueDate, pdfLink, senderEmail, appPassword } = body || {};
    if (!to) return Response.json({ error: 'Recipient email is required' }, { status: 400 });

    const subject = `Payment Reminder — Invoice ${invoiceNumber || ""}`;
    const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:auto;color:#1e293b;">
      <h2 style="color:#6D28D9;margin-bottom:8px;">Plivex Payment Reminder</h2>
      <p>Hi ${clientName || "there"},</p>
      <p>This is a gentle reminder that invoice <strong>${invoiceNumber || ""}</strong> for <strong>${amount || ""}</strong>${dueDate ? ` was due on <strong>${dueDate}</strong>` : ""} and appears to be pending.</p>
      ${pdfLink ? `<p>You can review or download the invoice here: <a href="${pdfLink}" style="color:#6D28D9;">${pdfLink}</a></p>` : ""}
      <p>If you have already paid, please disregard this note. For any questions, simply reply to this email or contact Plivex Support.</p>
      <p style="margin-top:24px;color:#64748b;font-size:12px;">— Sent via Plivex · plivex.helps@gmail.com</p>
    </div>`;

    const attachments = [];
    if (pdfLink) {
      try {
        const res = await fetch(pdfLink);
        if (res.ok) {
          const buf = await res.arrayBuffer();
          attachments.push({ filename: `Plivex_${invoiceNumber || "reminder"}.pdf`, content: buf });
        }
      } catch { /* ignore attachment fetch failure */ }
    }

    await sendGmail({ to, subject, html, senderEmail, appPassword, attachments });
    return Response.json({ ok: true, sentTo: to });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}