import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  createAdminNotification,
  createNotificationForUser,
  createNotificationsForUsers,
} from '@/lib/serverNotifications';

if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_ADMIN_SDK_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    } else {
      try {
        const serviceAccountPath = join(process.cwd(), 'firebase-service-account.json');
        const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } catch {
        admin.initializeApp();
      }
    }
  } catch (error: any) {
    console.error('❌ Firebase Admin initialization error:', error.message);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      classId,
      className,
      sessionId,
      sessionNumber,
      sessionDate,
      sessionTime,
      meetingLink,
      creatorId,
      createdBy,
    } = body;

    if (!classId || !className) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: classId and className' },
        { status: 400 },
      );
    }

    const db = admin.firestore();
    const resolvedClassId = String(classId).trim();
    const resolvedClassName = String(className).trim();
    const resolvedSessionId = String(sessionId || '').trim();
    const resolvedSessionTime = String(sessionTime || '').trim();

    const classDoc = await db.collection('classes').doc(resolvedClassId).get();
    const classData = classDoc.exists ? classDoc.data() : null;
    const resolvedCreatorId = String(creatorId || classData?.creatorId || '').trim();

    const enrollmentsSnapshot = await db
      .collection('enrollments')
      .where('classId', '==', resolvedClassId)
      .get();

    const studentIds = Array.from(
      new Set(
        enrollmentsSnapshot.docs
          .map((doc) => String(doc.data()?.studentId || '').trim())
          .filter(Boolean),
      ),
    );

    const title = `Session Scheduled: ${resolvedClassName}`;
    const message = `Session ${sessionNumber || ''} for "${resolvedClassName}" has been scheduled${resolvedSessionTime ? ` at ${resolvedSessionTime}` : ''}.`;

    const metadata = {
      classId: resolvedClassId,
      className: resolvedClassName,
      sessionId: resolvedSessionId || null,
      sessionNumber: sessionNumber || null,
      sessionDate: sessionDate || null,
      sessionTime: resolvedSessionTime || null,
      meetingLink: meetingLink || null,
      createdBy: createdBy || 'unknown',
    };

    await createAdminNotification(db, {
      type: 'admin_session_scheduled',
      title,
      message,
      link: `/admin-dashboard?classId=${resolvedClassId}`,
      relatedId: resolvedClassId,
      metadata,
    });

    if (resolvedCreatorId) {
      await createNotificationForUser(db, resolvedCreatorId, 'creator', {
        type: 'creator_session_scheduled',
        title,
        message,
        link: `/creator-dashboard?classId=${resolvedClassId}`,
        relatedId: resolvedClassId,
        metadata,
      });
    }

    if (studentIds.length > 0) {
      await createNotificationsForUsers(db, studentIds, 'student', {
        type: 'session_scheduled',
        title,
        message,
        link: '/student-dashboard?view=upcoming-sessions',
        relatedId: resolvedClassId,
        metadata,
      });
    }

    return NextResponse.json({
      success: true,
      studentsNotified: studentIds.length,
      hasCreatorNotification: !!resolvedCreatorId,
    });
  } catch (error: any) {
    console.error('Error creating session-event notifications:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create session notifications' },
      { status: 500 },
    );
  }
}
