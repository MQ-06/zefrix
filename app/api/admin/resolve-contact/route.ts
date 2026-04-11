import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';

if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_ADMIN_SDK_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_KEY);
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({ credential: admin.credential.applicationDefault() });
    } else {
      const serviceAccountPath = join(process.cwd(), 'firebase-service-account.json');
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    }
  } catch (error: any) {
    console.error('❌ Firebase Admin init error:', error.message);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contactId, status, adminReply, contactEmail, contactName, subject } = body;

    if (!contactId || !status) {
      return NextResponse.json({ success: false, error: 'Missing contactId or status' }, { status: 400 });
    }

    const db = admin.firestore();
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://zefrix.com';

    // Update contact document status
    await db.collection('contacts').doc(contactId).update({
      status,
      adminReply: adminReply || null,
      resolvedAt: status === 'resolved' ? admin.firestore.FieldValue.serverTimestamp() : null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Send acknowledgment/reply email if there's a reply and an email address
    if (adminReply && contactEmail) {
      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey) {
        const { Resend } = await import('resend');
        const resend = new Resend(resendKey);

        const statusLabel = status === 'resolved' ? 'Resolved' : 'In Progress';
        const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:linear-gradient(135deg,#D92A63 0%,#FF654B 100%);padding:30px;text-align:center;border-radius:10px 10px 0 0;">
    <h1 style="color:white;margin:0;">Response to Your Inquiry</h1>
  </div>
  <div style="background:#f9f9f9;padding:30px;border-radius:0 0 10px 10px;">
    <p>Hi ${contactName || 'there'},</p>
    <p>Thank you for reaching out to us. We have reviewed your message regarding <strong>${subject || 'your inquiry'}</strong>.</p>
    <div style="background:white;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #D92A63;">
      <h3 style="margin-top:0;color:#D92A63;">Our Response</h3>
      <p style="white-space:pre-wrap;">${adminReply}</p>
    </div>
    <p style="color:#666;font-size:0.875rem;">Status: <strong style="color:${status === 'resolved' ? '#4CAF50' : '#FF9800'};">${statusLabel}</strong></p>
    <p>If you have further questions, feel free to reach us at <a href="${BASE_URL}/contact" style="color:#D92A63;">our contact page</a>.</p>
    <p style="margin-top:30px;">Best regards,<br><strong>The Zefrix Team</strong></p>
  </div>
</body>
</html>`;

        await resend.emails.send({
          from: process.env.FROM_EMAIL || 'notifications@zefrixapp.com',
          to: contactEmail,
          subject: `Re: ${subject || 'Your Inquiry'} – Zefrix`,
          html,
        }).catch((err: any) => console.error('Contact reply email error:', err));
      }
    }

    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    console.error('Error resolving contact:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
