import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendEmail } from '@/backend/utils/mailer';
import { env } from '@/backend/config/env';
import { getDeliverySettings } from '@/backend/services/platformSettingsService';
import { createErrorResponse, createSuccessResponse } from '@/backend/utils/response';
import { HTTP_STATUS } from '@/backend/constants';

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(8).max(20),
  message: z.string().trim().min(10).max(2000),
});

function escapeHtml(v: string) {
  return v.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        createErrorResponse('Invalid contact form data.', { statusCode: HTTP_STATUS.BAD_REQUEST, code: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors }),
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    const adminEmail = env.contactAdminEmail || env.notificationEmailFrom || env.smtpUser;
    if (!adminEmail) {
      return NextResponse.json(
        createErrorResponse('Contact email is not configured.', { statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR, code: 'EMAIL_NOT_CONFIGURED' }),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
      );
    }

    const { name, email, phone, message } = parsed.data;
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safePhone = escapeHtml(phone);
    const safeMessage = escapeHtml(message).replace(/\n/g, '<br/>');

    await sendEmail({
      to: adminEmail,
      replyTo: email,
      subject: `New Contact Form Submission - ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\n\nMessage:\n${message}`,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#212121">
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Phone:</strong> ${safePhone}</p>
        <p><strong>Message:</strong><br/>${safeMessage}</p>
      </div>`,
    });

    return NextResponse.json(createSuccessResponse({ sent: true }, { message: 'Message sent successfully.' }), { status: HTTP_STATUS.OK });
  } catch (error: any) {
    return NextResponse.json(
      createErrorResponse(error?.message || 'Failed to send message.', { statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR, code: 'CONTACT_SEND_FAILED' }),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
