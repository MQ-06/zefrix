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
  } catch (e: any) {
    console.error('Firebase Admin init error:', e.message);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { enrollmentId, reason, adminNote } = body;

    if (!enrollmentId) {
      return NextResponse.json({ success: false, error: 'enrollmentId required' }, { status: 400 });
    }

    const db = admin.firestore();
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://zefrix.com';

    // Fetch enrollment
    const enrollmentRef = db.collection('enrollments').doc(enrollmentId);
    const enrollmentSnap = await enrollmentRef.get();
    if (!enrollmentSnap.exists) {
      return NextResponse.json({ success: false, error: 'Enrollment not found' }, { status: 404 });
    }

    const enrollment = enrollmentSnap.data()!;

    // Mark enrollment as cancelled
    await enrollmentRef.update({
      status: 'cancelled',
      cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
      cancelReason: reason || 'Cancelled by admin',
      adminNote: adminNote || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const className = enrollment.className || 'your batch';
    const studentId = enrollment.studentId;
    const studentEmail = enrollment.studentEmail;
    const studentName = enrollment.studentName || 'Student';
    const creatorId = enrollment.creatorId;

    const notifPromises: Promise<any>[] = [];

    // In-app notification to student
    if (studentId) {
      notifPromises.push(
        db.collection('notifications').add({
          userId: studentId,
          userRole: 'student',
          type: 'enrollment_cancelled',
          title: `Enrollment Cancelled — ${className}`,
          message: `Your enrollment in "${className}" has been cancelled by admin.${reason ? ' Reason: ' + reason : ''} Contact support if you have questions.`,
          link: '/student-dashboard',
          relatedId: enrollment.classId,
          isRead: false,
          metadata: { enrollmentId, classId: enrollment.classId, className, reason },
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      );
    }

    // Email to student
    const resendKey = process.env.RESEND_API_KEY;
    if (studentEmail && resendKey) {
      const { Resend } = await import('resend');
      const resend = new Resend(resendKey);
      const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:linear-gradient(135deg,#f44336 0%,#d32f2f 100%);padding:30px;text-align:center;border-radius:10px 10px 0 0;">
    <h1 style="color:white;margin:0;">Enrollment Cancelled</h1>
  </div>
  <div style="background:#f9f9f9;padding:30px;border-radius:0 0 10px 10px;">
    <p>Hi ${studentName},</p>
    <p>Your enrollment in <strong>${className}</strong> has been cancelled by our admin team.</p>
    ${reason ? `<div style="background:white;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid #f44336;"><strong>Reason:</strong> ${reason}</div>` : ''}
    <p>If you believe this is a mistake or have questions, please <a href="${BASE_URL}/contact-us" style="color:#D92A63;">contact our support team</a>.</p>
    <p style="margin-top:30px;">Best regards,<br><strong>The Zefrix Team</strong></p>
  </div>
</body></html>`;
      notifPromises.push(
        resend.emails.send({
          from: process.env.FROM_EMAIL || 'notifications@zefrixapp.com',
          to: studentEmail,
          subject: `Enrollment Cancelled: ${className}`,
          html,
        }).catch((e: any) => console.error('Cancel email error:', e))
      );
    }

    // In-app notification to creator
    if (creatorId) {
      notifPromises.push(
        db.collection('notifications').add({
          userId: creatorId,
          userRole: 'creator',
          type: 'enrollment_cancelled',
          title: `Enrollment Cancelled — ${className}`,
          message: `${studentName}'s enrollment in "${className}" was cancelled by admin.`,
          link: '/creator-dashboard',
          relatedId: enrollment.classId,
          isRead: false,
          metadata: { enrollmentId, classId: enrollment.classId, className, studentName },
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      );
    }

    await Promise.all(notifPromises);

    return NextResponse.json({ success: true, enrollmentId, status: 'cancelled' });
  } catch (error: any) {
    console.error('Error cancelling enrollment:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
