import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';

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
    const { classId, className, studentName, studentEmail, enrollmentId } = body;

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
      console.warn('⚠️ No creatorId found in class document, skipping notification');
      return NextResponse.json({ 
        success: false, 
        error: 'Creator ID not found',
        notificationSent: false 
      });
    }

    // Create notification for creator
    const notificationsRef = db.collection('notifications');
    await notificationsRef.add({
      userId: creatorId,
      userRole: 'creator',
      type: 'new_student_enrollment',
      title: `New Student Enrolled: ${className}`,
      message: `${studentName || 'A student'} has enrolled in your class "${className}".`,
      link: `/creator-dashboard?classId=${classId}`,
      relatedId: classId,
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        classId,
        className,
        studentName: studentName || 'Student',
        studentEmail: studentEmail || '',
        enrollmentId: enrollmentId || null,
      },
    });

    console.log(`✅ Enrollment notification created for creator: ${creatorId}, class: ${className}`);

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

