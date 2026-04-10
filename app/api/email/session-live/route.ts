import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';
import { sendSessionLiveEmail } from '@/lib/email';

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
    const { classId, sessionId, className, sessionNumber, meetingLink } = body;

    if (!classId || !className || !meetingLink) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: classId, className, meetingLink' },
        { status: 400 }
      );
    }

    const db = admin.firestore();

    // Get all enrolled students for this class
    const enrollmentsSnap = await db.collection('enrollments')
      .where('classId', '==', classId)
      .where('status', '==', 'active')
      .get();

    if (enrollmentsSnap.empty) {
      return NextResponse.json({ success: true, message: 'No enrolled students to notify', sent: 0 });
    }

    const emailPromises: Promise<void>[] = [];
    enrollmentsSnap.forEach((doc) => {
      const e = doc.data();
      if (!e.studentEmail) return;
      emailPromises.push(
        sendSessionLiveEmail({
          studentName: e.studentName || 'Student',
          studentEmail: e.studentEmail,
          studentId: e.studentId,
          className,
          classId,
          sessionNumber: sessionNumber || 1,
          meetingLink,
        }).catch((err) => console.error(`Failed to send session-live email to ${e.studentEmail}:`, err))
      );
    });

    await Promise.all(emailPromises);

    console.log(`✅ Session-live emails sent to ${emailPromises.length} students for class: ${className}`);
    return NextResponse.json({ success: true, sent: emailPromises.length });
  } catch (error: any) {
    console.error('Error sending session-live emails:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send session-live emails' },
      { status: 500 }
    );
  }
}
