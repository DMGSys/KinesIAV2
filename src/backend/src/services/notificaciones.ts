import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
  return transporter;
}

export async function enviarEmail(to: string, subject: string, text: string): Promise<void> {
  const t = getTransporter();
  if (!t) {
    console.warn('SMTP no configurado, email no enviado');
    return;
  }
  try {
    await t.sendMail({ from: process.env.SMTP_FROM || 'noreply@kinesia.com', to, subject, text });
  } catch (e) {
    console.error('Error enviando email:', e);
  }
}
