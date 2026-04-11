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
    const { classId, sessionId, sessionNumber, className, sessionDate, sessionTime } = body;

    if (!classId || !className) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const db = admin.firestore();
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://zefrix.com';

    // Get all enrolled students for this class
    const enrollmentsSnap = await db.collection('enrollments')
      .where('classId', '==', classId)
      .where('status', '==', 'active')
      .get();

    if (enrollmentsSnap.empty) {
      return NextResponse.json({ success: true, message: 'No enrolled students to notify', notified: 0 });
    }

    const notifPromises: Promise<any>[] = [];
    const resendKey = process.env.RESEND_API_KEY;
    const resend = resendKey ? new (await import('resend')).Resend(resendKey) : null;

    enrollmentsSnap.forEach((doc) => {
      const e = doc.data();
      if (!e.studentId) return;

      const sessionLabel = sessionNumber ? `Session ${sessionNumber}` : 'a session';
      const dateLabel = sessionDate ? ` scheduled for ${sessionDate}${sessionTime ? ' at ' + sessionTime : ''}` : '';

      // In-app notification
      notifPromises.push(
        db.collection('notifications').add({
          userId: e.studentId,
          userRole: 'student',
          type: 'session_cancelled',
          title: `Session Cancelled – ${className}`,
          message: `${sessionLabel} of "${className}"${dateLabel} has been cancelled. Please check your dashboard for updated schedule.`,
          link: '/student-dashboard',
          relatedId: classId,
          isRead: false,
          metadata: { classId, sessionId, sessionNumber, sessionDate, sessionTime },
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        }).catch((err: any) => console.error('Session cancelled notification error:', err))
      );

      // Email notification
      if (e.studentEmail && resend) {
        const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:linear-gradient(135deg,#f44336 0%,#d32f2f 100%);padding:30px;text-align:center;border-radius:10px 10px 0 0;">
    <h1 style="color:white;margin:0;">Session Cancelled</h1>
  </div>
  <div style="background:#f9f9f9;padding:30px;border-radius:0 0 10px 10px;">
    <p>Hi ${e.studentName || 'Student'},</p>
    <p>We're sorry to inform you that <strong>${sessionLabel}</strong> of <strong>${className}</strong>${dateLabel} has been cancelled.</p>
    <div style="background:white;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #f44336;">
      <p style="margin:0;color:#666;">Please check your student dashboard for the updated session schedule and any rescheduled sessions.</p>
    </div>
    <p><a href="${BASE_URL}/student-dashboard" style="display:inline-block;background:#D92A63;color:white;padding:12px 30px;text-decoration:none;border-radius:5px;margin:10px 0;">View Dashboard</a></p>
    <p>We apologize for any inconvenience caused.</p>
    <p style="margin-top:30px;">Best regards,<br><strong>The Zefrix Team</strong></p>
  </div>
</body>
</html>`;

        notifPromises.push(
          resend.emails.send({
            from: process.env.FROM_EMAIL || 'notifications@zefrixapp.com',
            to: e.studentEmail,
            subject: `Session Cancelled – ${className}`,
            html,
          }).catch((err: any) => console.error(`Session cancelled email error for ${e.studentEmail}:`, err))
        );
      }
    });

    await Promise.all(notifPromises);

    return NextResponse.json({ success: true, notified: enrollmentsSnap.size });
  } catch (error: any) {
    console.error('Error sending session cancelled notifications:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
