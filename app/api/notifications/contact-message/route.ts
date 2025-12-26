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
    const { name, email, subject, messageId } = body;

    if (!name || !email || !subject) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = admin.firestore();
    
    // Get admin user IDs (support multiple admins)
    const ADMIN_EMAILS = ['kartik@zefrix.com', 'mariamqadeem181@gmail.com'];
    const adminUsers = await Promise.all(
      ADMIN_EMAILS.map(async (adminEmail) => {
        const usersSnapshot = await db.collection('users').where('email', '==', adminEmail).limit(1).get();
        if (!usersSnapshot.empty) {
          return usersSnapshot.docs[0].id;
        }
        return null;
      })
    );

    const validAdminIds = adminUsers.filter(id => id !== null);

    if (validAdminIds.length === 0) {
      console.warn('⚠️ No admin users found, skipping notification creation');
      return NextResponse.json({ 
        success: false, 
        error: 'Admin users not found',
        notificationSent: false 
      });
    }

    // Create notifications for all admin users
    const notificationsRef = db.collection('notifications');
    const notificationPromises = validAdminIds.map(async (adminUserId) => {
      await notificationsRef.add({
        userId: adminUserId,
        userRole: 'admin',
        type: 'new_contact_message',
        title: `New Contact Message: ${subject}`,
        message: `New message from ${name} (${email}): ${subject}`,
        link: '/admin-dashboard?page=contact-messages',
        relatedId: messageId || null,
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          name,
          email,
          subject,
          messageId: messageId || null,
        },
      });
    });

    await Promise.all(notificationPromises);

    console.log(`✅ Contact message notifications created for ${validAdminIds.length} admin(s)`);

    return NextResponse.json({ 
      success: true, 
      message: 'Notification created successfully',
      notificationSent: true 
    });
  } catch (error: any) {
    console.error('Error creating contact message notification:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create notification' },
      { status: 500 }
    );
  }
}

