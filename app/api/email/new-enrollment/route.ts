import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';
import { sendNewEnrollmentAlertEmail } from '@/lib/email';

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
    const { classId, className, studentName, studentEmail } = body;

    if (!classId || !className || !studentName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: classId, className, studentName' },
        { status: 400 }
      );
    }

    const db = admin.firestore();

    // Get creator details from class document
    const classDoc = await db.collection('classes').doc(classId).get();
    if (!classDoc.exists) {
      return NextResponse.json({ success: false, error: 'Class not found' }, { status: 404 });
    }

    const classData = classDoc.data()!;
    const creatorId = classData.creatorId;

    if (!creatorId) {
      return NextResponse.json({ success: false, error: 'No creatorId on class' }, { status: 400 });
    }

    // Get creator's email from users collection
    const creatorDoc = await db.collection('users').doc(creatorId).get();
    if (!creatorDoc.exists) {
      return NextResponse.json({ success: false, error: 'Creator user not found' }, { status: 404 });
    }

    const creatorData = creatorDoc.data()!;
    const creatorEmail = creatorData.email;
    const creatorName = creatorData.name || creatorData.displayName || 'Creator';

    if (!creatorEmail) {
      return NextResponse.json({ success: false, error: 'Creator has no email' }, { status: 400 });
    }

    // Get total enrollment count for this class
    const enrollmentsSnap = await db.collection('enrollments')
      .where('classId', '==', classId)
      .where('status', '==', 'active')
      .get();
    const totalEnrollments = enrollmentsSnap.size;

    await sendNewEnrollmentAlertEmail({
      creatorName,
      creatorEmail,
      creatorId,
      className,
      classId,
      studentName,
      studentEmail: studentEmail || '',
      totalEnrollments,
    });

    // In-app notification to creator
    await db.collection('notifications').add({
      userId: creatorId,
      userRole: 'creator',
      type: 'new_enrollment',
      title: `New Student Enrolled — ${className}`,
      message: `${studentName} has enrolled in your batch "${className}". Total enrollments: ${totalEnrollments}.`,
      link: '/creator-dashboard',
      relatedId: classId,
      isRead: false,
      metadata: { classId, className, studentName, studentEmail: studentEmail || '', totalEnrollments },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, message: 'Enrollment alert sent to creator' });
  } catch (error: any) {
    console.error('Error sending new-enrollment alert email:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send enrollment alert' },
      { status: 500 }
    );
  }
}
