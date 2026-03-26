import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  createAdminNotification,
  createNotificationForUser,
} from '@/lib/serverNotifications';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_ADMIN_SDK_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault()
      });
    } else {
      try {
        const serviceAccountPath = join(process.cwd(), 'firebase-service-account.json');
        const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
      } catch (fileError) {
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
    const { classId, className, studentId, studentName, studentEmail, enrollmentId } = body;

    if (!classId || !className) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: classId and className' },
        { status: 400 }
      );
    }

    const db = admin.firestore();
    
    // Get creatorId from class document
    const classDoc = await db.collection('classes').doc(classId).get();
    if (!classDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Batch not found' },
        { status: 404 }
      );
    }

    const classData = classDoc.data();
    const creatorId = classData?.creatorId;

    if (!creatorId) {
      console.warn('⚠️ No creatorId found in class document, creator-specific notification will be skipped');
    }

    const normalizedStudentName = studentName || 'A student';

    if (creatorId) {
      await createNotificationForUser(db, creatorId, 'creator', {
        type: 'new_student_enrollment',
        title: `New Student Enrolled: ${className}`,
        message: `${normalizedStudentName} has enrolled in your class "${className}".`,
        link: `/creator-dashboard?classId=${classId}`,
        relatedId: classId,
        metadata: {
          classId,
          className,
          studentName: normalizedStudentName,
          studentEmail: studentEmail || '',
          enrollmentId: enrollmentId || null,
        },
      });
    }

    if (studentId) {
      await createNotificationForUser(db, String(studentId), 'student', {
        type: 'enrollment_confirmed',
        title: `Enrollment Confirmed: ${className}`,
        message: `You are enrolled in "${className}". Check your dashboard for details.`,
        link: '/student-dashboard?view=my-enrollments',
        relatedId: classId,
        metadata: {
          classId,
          className,
          enrollmentId: enrollmentId || null,
          creatorId,
        },
      });
    }

    await createAdminNotification(db, {
      type: 'admin_new_enrollment',
      title: `New Enrollment: ${className}`,
      message: `${normalizedStudentName} enrolled in "${className}".`,
      link: '/admin-dashboard?page=enrollments',
      relatedId: classId,
      metadata: {
        classId,
        className,
        creatorId,
        studentId: studentId || null,
        studentName: normalizedStudentName,
        studentEmail: studentEmail || '',
        enrollmentId: enrollmentId || null,
      },
    });

    console.log(`✅ Enrollment notifications processed for class: ${className}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Notification created successfully',
      notificationSent: true 
    });
  } catch (error: any) {
    console.error('Error creating enrollment notification:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create notification' },
      { status: 500 }
    );
  }
}

