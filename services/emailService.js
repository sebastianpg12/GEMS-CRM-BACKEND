const nodemailer = require('nodemailer');

// ─── Transporter ─────────────────────────────────────────────────────────────
let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

// ─── Core helper ─────────────────────────────────────────────────────────────
async function sendMail({ to, subject, html, text }) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn('[Email] Skipping: Missing config:', { 
      host: host ? 'OK' : 'MISSING', 
      user: user ? 'OK' : 'MISSING', 
      pass: pass ? 'OK' : 'MISSING' 
    });
    return null;
  }
  try {
    const info = await getTransporter().sendMail({
      from: process.env.EMAIL_FROM || `"CRM Soporte" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text,
    });
    console.log('[Email] Sent to', to, '| messageId:', info.messageId);
    return info;
  } catch (err) {
    console.error('[Email] Error sending to', to, '–', err.message);
    return null;
  }
}

// ─── Templates ───────────────────────────────────────────────────────────────

function ticketCreatedClientHtml(ticket) {
  return `
  <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:auto;background:#f9fafc;border-radius:12px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:32px 40px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700">Customer CRM Support</h1>
      <p style="color:#a0aec0;margin:8px 0 0;font-size:14px">Confirmación de ticket creado</p>
    </div>
    <div style="padding:32px 40px;background:#fff">
      <p style="font-size:16px;color:#2d3748">Hola <strong>${ticket.submittedBy?.name || 'Cliente'}</strong>,</p>
      <p style="color:#4a5568">Tu solicitud ha sido registrada exitosamente. El equipo de soporte la atenderá a la brevedad.</p>
      <div style="background:#f7fafc;border-left:4px solid #667eea;border-radius:8px;padding:20px;margin:24px 0">
        <p style="margin:0 0 8px;color:#718096;font-size:12px;text-transform:uppercase;letter-spacing:.5px">Detalles del ticket</p>
        <p style="margin:6px 0;font-size:14px;color:#2d3748"><strong>ID:</strong> #${ticket.ticketNumber || ticket._id}</p>
        <p style="margin:6px 0;font-size:14px;color:#2d3748"><strong>Asunto:</strong> ${ticket.subject}</p>
        <p style="margin:6px 0;font-size:14px;color:#2d3748"><strong>Prioridad:</strong> ${ticket.priority || 'Media'}</p>
        <p style="margin:6px 0;font-size:14px;color:#2d3748"><strong>Estado:</strong> ${ticket.status || 'open'}</p>
      </div>
      <p style="color:#718096;font-size:13px">Recibirás actualizaciones por este medio cuando el estado de tu ticket cambie.</p>
    </div>
    <div style="background:#f7fafc;padding:20px 40px;text-align:center">
      <p style="color:#a0aec0;font-size:12px;margin:0">© ${new Date().getFullYear()} Customer CRM Support</p>
    </div>
  </div>`;
}

function ticketCreatedInternalHtml(ticket, assignedAgent) {
  return `
  <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:auto;background:#f9fafc;border-radius:12px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:32px 40px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700">🎫 Nuevo Ticket Recibido</h1>
      <p style="color:#a0aec0;margin:8px 0 0;font-size:14px">Notificación interna</p>
    </div>
    <div style="padding:32px 40px;background:#fff">
      <div style="background:#f7fafc;border-left:4px solid #48bb78;border-radius:8px;padding:20px;margin-bottom:24px">
        <p style="margin:6px 0;font-size:14px;color:#2d3748"><strong>Nombre:</strong> ${ticket.submittedBy?.name || '—'}</p>
        <p style="margin:6px 0;font-size:14px;color:#2d3748"><strong>Email:</strong> ${ticket.submittedBy?.email || '—'}</p>
      </div>
      <div style="background:#f7fafc;border-left:4px solid #667eea;border-radius:8px;padding:20px;margin-bottom:24px">
        <p style="margin:6px 0;font-size:14px;color:#2d3748"><strong>Asunto:</strong> ${ticket.subject}</p>
        <p style="margin:6px 0;font-size:14px;color:#2d3748"><strong>Descripción:</strong> ${ticket.description}</p>
      </div>
      ${assignedAgent ? `<p style="color:#4a5568;font-size:14px">Asignado a: <strong>${assignedAgent.name}</strong></p>` : ''}
    </div>
  </div>`;
}

function ticketStatusChangedHtml(ticket, oldStatus, newStatus) {
  return `
  <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:auto;background:#f9fafc;border-radius:12px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:32px 40px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700">Actualización de ticket</h1>
    </div>
    <div style="padding:32px 40px;background:#fff">
      <p style="font-size:16px;color:#2d3748">Hola <strong>${ticket.submittedBy?.name || 'Cliente'}</strong>,</p>
      <p style="color:#4a5568">El estado de tu ticket #${ticket.ticketNumber || ticket._id} ha cambiado de <strong>${oldStatus}</strong> a <strong>${newStatus}</strong>.</p>
    </div>
  </div>`;
}

// ─── Exported notification helpers ───────────────────────────────────────────

async function notifyTicketCreated(ticket, assignedAgent) {
  console.log('[Email] notifyTicketCreated called for ticket:', ticket.ticketNumber || ticket._id);
  const supportEmail = process.env.SUPPORT_EMAIL || process.env.SMTP_USER;
  if (ticket.submittedBy?.email) {
    await sendMail({
      to: ticket.submittedBy.email,
      subject: `[Ticket #${ticket.ticketNumber || ticket._id}] Recibido: ${ticket.subject}`,
      html: ticketCreatedClientHtml(ticket),
    });
  }
  if (supportEmail) {
    await sendMail({
      to: supportEmail,
      subject: `🎫 Nuevo ticket de ${ticket.submittedBy?.name}: ${ticket.subject}`,
      html: ticketCreatedInternalHtml(ticket, assignedAgent),
    });
  }
}

async function notifyStatusChanged(ticket, oldStatus, newStatus) {
  if (ticket.submittedBy?.email) {
    await sendMail({
      to: ticket.submittedBy.email,
      subject: `[Ticket #${ticket.ticketNumber || ticket._id}] Estado: ${newStatus}`,
      html: ticketStatusChangedHtml(ticket, oldStatus, newStatus),
    });
  }
}

module.exports = { sendMail, notifyTicketCreated, notifyStatusChanged };
