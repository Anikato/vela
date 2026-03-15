import nodemailer from 'nodemailer';

import { decryptSecret } from '@/lib/crypto';
import { db } from '@/server/db';
import type { InquiryProductSnapshot } from './inquiry.service';

// ─── Types ───

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  fromName: string;
  fromEmail: string;
}

export interface InquiryEmailPayload {
  inquiryNumber: string;
  customerName: string;
  customerEmail: string;
  phone: string | null;
  company: string | null;
  country: string | null;
  message: string;
  sourceUrl: string | null;
  products: Array<{
    snapshot: InquiryProductSnapshot;
    quantity: number;
  }>;
  siteName: string;
}

// ─── SMTP ───

async function getSmtpConfig(): Promise<SmtpConfig | null> {
  const row = await db.query.siteSettings.findFirst();
  if (!row?.smtpHost || !row.smtpPort || !row.smtpUser || !row.smtpPassword) {
    return null;
  }
  return {
    host: row.smtpHost,
    port: row.smtpPort,
    user: row.smtpUser,
    password: decryptSecret(row.smtpPassword),
    fromName: row.smtpFromName || 'Vela',
    fromEmail: row.smtpFromEmail || row.smtpUser,
  };
}

async function getNotificationEmails(): Promise<string[]> {
  const row = await db.query.siteSettings.findFirst();
  return (row?.notificationEmails as string[]) ?? [];
}

function createTransporter(config: SmtpConfig) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.password,
    },
  });
}

// ─── Public API ───

/** 发送测试邮件（后台 SMTP 验证） */
export async function sendTestEmail(recipientEmail: string): Promise<void> {
  const config = await getSmtpConfig();
  if (!config) throw new Error('SMTP 未配置，请先填写服务器、端口、用户名和密码');

  const transporter = createTransporter(config);

  await transporter.sendMail({
    from: `"${config.fromName}" <${config.fromEmail}>`,
    to: recipientEmail,
    subject: 'Vela — SMTP Test Email',
    text: 'This is a test email from Vela. If you received this, your SMTP settings are working correctly.',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <h2 style="color:#333;">SMTP Configuration Test</h2>
        <p style="color:#555;">This is a test email sent from Vela.</p>
        <p style="color:#555;">If you received this, your SMTP settings are working correctly.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
        <p style="color:#999;font-size:12px;">Sent by Vela Email Service</p>
      </div>
    `,
  });
}

/** 询盘通知邮件（发给企业） */
export async function sendInquiryNotification(payload: InquiryEmailPayload): Promise<void> {
  const config = await getSmtpConfig();
  if (!config) return;

  const recipients = await getNotificationEmails();
  if (recipients.length === 0) return;

  const transporter = createTransporter(config);

  const productRows = payload.products
    .map(
      (p) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">${escapeHtml(p.snapshot.name)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">${escapeHtml(p.snapshot.sku)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${p.quantity}</td>
        </tr>`,
    )
    .join('');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;">
      <h2 style="color:#333;margin-bottom:4px;">New Inquiry from ${escapeHtml(payload.customerName)}</h2>
      <p style="color:#888;font-size:13px;margin-top:0;">Inquiry #${escapeHtml(payload.inquiryNumber)}</p>

      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:6px 0;color:#888;width:120px;">Name</td><td style="padding:6px 0;">${escapeHtml(payload.customerName)}</td></tr>
        <tr><td style="padding:6px 0;color:#888;">Email</td><td style="padding:6px 0;"><a href="mailto:${escapeHtml(payload.customerEmail)}">${escapeHtml(payload.customerEmail)}</a></td></tr>
        ${payload.phone ? `<tr><td style="padding:6px 0;color:#888;">Phone</td><td style="padding:6px 0;">${escapeHtml(payload.phone)}</td></tr>` : ''}
        ${payload.company ? `<tr><td style="padding:6px 0;color:#888;">Company</td><td style="padding:6px 0;">${escapeHtml(payload.company)}</td></tr>` : ''}
        ${payload.country ? `<tr><td style="padding:6px 0;color:#888;">Country</td><td style="padding:6px 0;">${escapeHtml(payload.country)}</td></tr>` : ''}
      </table>

      <h3 style="color:#333;margin-top:24px;">Message</h3>
      <p style="color:#555;white-space:pre-wrap;">${escapeHtml(payload.message)}</p>

      ${
        payload.products.length > 0
          ? `
        <h3 style="color:#333;margin-top:24px;">Products (${payload.products.length})</h3>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#f5f5f5;">
              <th style="padding:8px 12px;text-align:left;font-weight:600;">Product</th>
              <th style="padding:8px 12px;text-align:left;font-weight:600;">SKU</th>
              <th style="padding:8px 12px;text-align:center;font-weight:600;">Qty</th>
            </tr>
          </thead>
          <tbody>${productRows}</tbody>
        </table>`
          : ''
      }

      ${payload.sourceUrl ? `<p style="color:#999;font-size:12px;margin-top:24px;">Source: ${escapeHtml(payload.sourceUrl)}</p>` : ''}
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
      <p style="color:#999;font-size:12px;">${escapeHtml(payload.siteName)} — Inquiry Notification</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"${config.fromName}" <${config.fromEmail}>`,
    to: recipients.join(', '),
    subject: `New Inquiry from ${payload.customerName} - ${payload.siteName}`,
    html,
  });
}

/** 询盘确认邮件（发给客户） */
export async function sendInquiryConfirmation(payload: InquiryEmailPayload): Promise<void> {
  const config = await getSmtpConfig();
  if (!config) return;

  const transporter = createTransporter(config);

  const productList = payload.products
    .map((p) => `<li>${escapeHtml(p.snapshot.name)} (${escapeHtml(p.snapshot.sku)}) × ${p.quantity}</li>`)
    .join('');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;">
      <h2 style="color:#333;">Thank you for your inquiry!</h2>
      <p style="color:#555;">Dear ${escapeHtml(payload.customerName)},</p>
      <p style="color:#555;">We have received your inquiry <strong>#${escapeHtml(payload.inquiryNumber)}</strong> and will get back to you as soon as possible.</p>

      ${
        payload.products.length > 0
          ? `
        <h3 style="color:#333;">Products you inquired about:</h3>
        <ul style="color:#555;">${productList}</ul>`
          : ''
      }

      <p style="color:#555;">Our team typically responds within 24 business hours.</p>

      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
      <p style="color:#999;font-size:12px;">This is an automated confirmation from ${escapeHtml(payload.siteName)}. Please do not reply to this email.</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"${config.fromName}" <${config.fromEmail}>`,
    to: payload.customerEmail,
    subject: `Thank you for your inquiry - ${payload.siteName}`,
    html,
  });
}

export { escapeHtml } from './email.utils';
import { escapeHtml } from './email.utils';
