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
    const {
      classId,
      sessionId,
      sessionNumber,
      className,
      creatorId,
      presentStudentIds,
      absentStudentIds,
      students, // [{ studentId, name, email }]
    } = body;

    if (!classId || !sessionId || !className) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const db = admin.firestore();
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://zefrix.com';

    const notifPromises: Promise<any>[] = [];

    // Notify each student about their attendance status
    for (const student of (students || [])) {
      const isPresent = (presentStudentIds || []).includes(student.studentId);
      const statusText = isPresent ? 'Present ✅' : 'Absent ❌';
      const statusColor = isPresent ? '#4CAF50' : '#f44336';

      // In-app notification
      notifPromises.push(
        db.collection('notifications').add({
          userId: student.studentId,
          userRole: 'student',
          type: 'attendance_marked',
          title: `Attendance Marked – ${className}`,
          message: `Your attendance for Session ${sessionNumber || 1} of "${className}" has been recorded as ${isPresent ? 'Present' : 'Absent'}.`,
          link: '/student-dashboard',
          relatedId: classId,
          isRead: false,
          metadata: { classId, sessionId, sessionNumber, attended: isPresent },
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        }).catch((err: any) => console.error('Notification error:', err))
      );

      // Email notification (skip if no email)
      if (student.email) {
        const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:linear-gradient(135deg,#D92A63 0%,#FF654B 100%);padding:30px;text-align:center;border-radius:10px 10px 0 0;">
    <h1 style="color:white;margin:0;">Class Attendance Report</h1>
  </div>
  <div style="background:#f9f9f9;padding:30px;border-radius:0 0 10px 10px;">
    <p>Hi ${student.name || 'Student'},</p>
    <p>Session ${sessionNumber || 1} of <strong>${className}</strong> has ended. Here is your attendance record:</p>
    <div style="background:white;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid ${statusColor};text-align:center;">
      <div style="font-size:2rem;font-weight:700;color:${statusColor};">${statusText}</div>
      <div style="color:#666;margin-top:8px;">Session ${sessionNumber || 1}</div>
    </div>
    <p>Keep learning and we'll see you at the next session!</p>
    <p><a href="${BASE_URL}/student-dashboard" style="display:inline-block;background:#D92A63;color:white;padding:12px 30px;text-decoration:none;border-radius:5px;margin:10px 0;">View Dashboard</a></p>
    <p style="margin-top:30px;">Best regards,<br><strong>The Zefrix Team</strong></p>
  </div>
</body>
</html>`;

        const resendKey = process.env.RESEND_API_KEY;
        if (resendKey) {
          const { Resend } = await import('resend');
          const resend = new Resend(resendKey);
          notifPromises.push(
            resend.emails.send({
              from: process.env.FROM_EMAIL || 'notifications@zefrixapp.com',
              to: student.email,
              subject: `Attendance: Session ${sessionNumber || 1} – ${className}`,
              html,
            }).catch((err: any) => console.error(`Attendance email error for ${student.email}:`, err))
          );
        }
      }
    }

    // Send summary notification to creator
    if (creatorId) {
      const totalStudents = (students || []).length;
      const presentCount = (presentStudentIds || []).length;
      const absentCount = (absentStudentIds || []).length;
      const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

      notifPromises.push(
        db.collection('notifications').add({
          userId: creatorId,
          userRole: 'creator',
          type: 'class_ended',
          title: `Session ${sessionNumber || 1} Ended – ${className}`,
          message: `Session ${sessionNumber || 1} has ended. ${presentCount}/${totalStudents} students attended (${attendanceRate}% attendance rate).`,
          link: '/creator-dashboard',
          relatedId: classId,
          isRead: false,
          metadata: {
            classId,
            sessionId,
            sessionNumber,
            totalStudents,
            presentCount,
            absentCount,
            attendanceRate,
          },
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        }).catch((err: any) => console.error('Creator summary notification error:', err))
      );
    }

    await Promise.all(notifPromises);

    return NextResponse.json({ success: true, notified: (students || []).length });
  } catch (error: any) {
    console.error('Error sending attendance summary:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
