import nodemailer from 'nodemailer';
import { env } from '@/backend/config/env';

type MailTransporter = ReturnType<typeof nodemailer.createTransport>;

function getTransporter(): MailTransporter {
  const host = env.smtpHost.trim();
  const user = env.smtpUser.trim();
  const pass = env.smtpPass.replace(/\s+/g, '');
  const from = (env.notificationEmailFrom || user).trim();
  if (!host || !user || !pass) {
    throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.');
  }
  return nodemailer.createTransport({
    host,
    port: env.smtpPort || 587,
    secure: env.smtpSecure,
    auth: { user, pass },
  });
}

export async function sendEmail(input: { to: string; subject: string; text: string; html?: string; replyTo?: string }) {
  const user = env.smtpUser.trim();
  const from = (env.notificationEmailFrom || user).trim();
  if (!from) throw new Error('Email sender is not configured. Set NOTIFICATION_EMAIL_FROM or SMTP_USER.');
  const tx = getTransporter();
  try {
    await tx.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      replyTo: input.replyTo,
    });
  } catch (err: any) {
    const msg = String(err?.message || '');
    if (err?.code === 'EAUTH' || /Username and Password not accepted|BadCredentials/i.test(msg)) {
      throw new Error('SMTP authentication failed. Verify SMTP_USER is the Gmail account that created the App Password, 2-Step Verification is enabled, and SMTP_PASS is a valid 16-character Gmail App Password (not your normal Gmail password). Restart the dev server after updating .env.local.');
    }
    throw err;
  }
}
