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
    const { classId, sessionId, sessionNumber, className, newDate, newTime, oldDate, meetingLink } = body;

    if (!classId || !className) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const db = admin.firestore();
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://zefrix.com';
    const resendKey = process.env.RESEND_API_KEY;
    const resend = resendKey ? new (await import('resend')).Resend(resendKey) : null;

    // Fetch all enrolled students
    const enrollmentsSnap = await db.collection('enrollments')
      .where('classId', '==', classId)
      .where('status', '==', 'active')
      .get();

    if (enrollmentsSnap.empty) {
      return NextResponse.json({ success: true, notified: 0 });
    }

    const notifPromises: Promise<any>[] = [];
    const sessionLabel = sessionNumber ? `Session ${sessionNumber}` : 'a session';

    enrollmentsSnap.forEach((doc) => {
      const e = doc.data();
      if (!e.studentId) return;

      // In-app notification
      notifPromises.push(
        db.collection('notifications').add({
          userId: e.studentId,
          userRole: 'student',
          type: 'session_rescheduled',
          title: `Session Rescheduled – ${className}`,
          message: `${sessionLabel} of "${className}" has been rescheduled.${newDate ? ` New date: ${newDate}${newTime ? ' at ' + newTime : ''}.` : ''} Please check your dashboard for the updated schedule.`,
          link: '/student-dashboard',
          relatedId: classId,
          isRead: false,
          metadata: { classId, sessionId, sessionNumber, newDate, newTime, oldDate, meetingLink },
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        }).catch((err: any) => console.error('Reschedule notification error:', err))
      );

      // Email
      if (e.studentEmail && resend) {
        const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:linear-gradient(135deg,#FF9800 0%,#F57C00 100%);padding:30px;text-align:center;border-radius:10px 10px 0 0;">
    <h1 style="color:white;margin:0;">📅 Session Rescheduled</h1>
  </div>
  <div style="background:#f9f9f9;padding:30px;border-radius:0 0 10px 10px;">
    <p>Hi ${e.studentName || 'Student'},</p>
    <p>${sessionLabel} of <strong>${className}</strong> has been rescheduled.</p>
    <div style="background:white;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #FF9800;">
      ${oldDate ? `<p style="margin:0;color:#999;"><s>Previous date: ${oldDate}</s></p>` : ''}
      ${newDate ? `<p style="margin:${oldDate ? '8px' : '0'} 0 0;"><strong>New date:</strong> ${newDate}${newTime ? ' at ' + newTime : ''}</p>` : ''}
      ${meetingLink ? `<p style="margin:8px 0 0;"><strong>Meeting link:</strong> <a href="${meetingLink}" style="color:#D92A63;">${meetingLink}</a></p>` : ''}
    </div>
    <p><a href="${BASE_URL}/student-dashboard" style="display:inline-block;background:#D92A63;color:white;padding:12px 30px;text-decoration:none;border-radius:5px;margin:10px 0;">View Dashboard</a></p>
    <p style="margin-top:30px;">Best regards,<br><strong>The Zefrix Team</strong></p>
  </div>
</body>
</html>`;

        notifPromises.push(
          resend.emails.send({
            from: process.env.FROM_EMAIL || 'notifications@zefrixapp.com',
            to: e.studentEmail,
            subject: `Session Rescheduled – ${className}`,
            html,
          }).catch((err: any) => console.error(`Reschedule email error for ${e.studentEmail}:`, err))
        );
      }
    });

    await Promise.all(notifPromises);

    return NextResponse.json({ success: true, notified: enrollmentsSnap.size });
  } catch (error: any) {
    console.error('Error sending session reschedule notifications:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
