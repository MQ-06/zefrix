import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createAdminNotification } from '@/lib/serverNotifications';

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
      eventType,
      userId,
      userName,
      userEmail,
      userRole,
      source,
    } = body;

    if (!eventType || !userId || !userEmail) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 },
      );
    }

    const db = admin.firestore();

    const resolvedName = String(userName || userEmail.split('@')[0] || 'User').trim();
    const resolvedEmail = String(userEmail).trim().toLowerCase();
    const resolvedRole = String(userRole || 'student').trim();
    const resolvedSource = String(source || 'unknown').trim();

    const title =
      eventType === 'creator_signup'
        ? `New Creator Signup: ${resolvedName}`
        : `New Learner Signup: ${resolvedName}`;

    const message =
      eventType === 'creator_signup'
        ? `${resolvedName} (${resolvedEmail}) completed creator signup.`
        : `${resolvedName} (${resolvedEmail}) signed up as a learner.`;

    const sentCount = await createAdminNotification(db, {
      type: eventType === 'creator_signup' ? 'admin_creator_signup' : 'admin_student_signup',
      title,
      message,
      link: '/admin-dashboard?page=creators',
      relatedId: userId,
      metadata: {
        userId,
        userName: resolvedName,
        userEmail: resolvedEmail,
        userRole: resolvedRole,
        source: resolvedSource,
      },
    });

    return NextResponse.json({
      success: true,
      notificationsSent: sentCount,
    });
  } catch (error: any) {
    console.error('Error creating user-event notification:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create notifications' },
      { status: 500 },
    );
  }
}
