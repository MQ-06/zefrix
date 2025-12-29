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

/**
 * Server-side API route to create notifications
 * This is called from email functions and other server-side code
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userRole, type, title, message, link, relatedId, metadata } = body;

    if (!userId || !userRole || !type || !title || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = admin.firestore();
    const notificationsRef = db.collection('notifications');

    const notificationData = {
      userId,
      userRole,
      type,
      title,
      message,
      link: link || null,
      relatedId: relatedId || null,
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      metadata: metadata || {},
    };

    await notificationsRef.add(notificationData);

    console.log(`✅ Notification created for ${userRole} ${userId}: ${title}`);

    return NextResponse.json({
      success: true,
      message: 'Notification created successfully',
    });
  } catch (error: any) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create notification' },
      { status: 500 }
    );
  }
}

