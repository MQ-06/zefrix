import { NextRequest, NextResponse } from 'next/server';
import { sendClassCreatedEmail } from '@/lib/email';
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
        const { creatorName, creatorEmail, className, classId, category, price } = body;

        if (!className || !classId) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        await sendClassCreatedEmail({
            creatorName: creatorName || 'Creator',
            creatorEmail: creatorEmail || '',
            className,
            classId,
            category: category || '',
            price: price || 0,
        });

        // Create notification for admin
        try {
            const db = admin.firestore();
            // Get admin user ID (assuming admin email is in env)
            const adminEmail = process.env.ADMIN_EMAIL || 'kartik@zefrix.com';
            const usersSnapshot = await db.collection('users').where('email', '==', adminEmail).limit(1).get();
            
            if (!usersSnapshot.empty) {
                const adminUserId = usersSnapshot.docs[0].id;
                const notificationsRef = db.collection('notifications');
                await notificationsRef.add({
                    userId: adminUserId,
                    userRole: 'admin',
                    type: 'new_class_submitted',
                    title: `New Class Pending Review: ${className}`,
                    message: `New class "${className}" submitted by ${creatorName || 'a creator'} needs review.`,
                    link: `/admin-dashboard?classId=${classId}`,
                    relatedId: classId,
                    isRead: false,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    metadata: {
                        className,
                        classId,
                        creatorName: creatorName || 'Creator',
                        creatorEmail: creatorEmail || '',
                        category: category || '',
                        price: price || 0,
                    },
                });
            }
        } catch (notifError) {
            console.error('Error creating admin notification:', notifError);
            // Don't fail the request if notification creation fails
        }

        return NextResponse.json({ success: true, message: 'Email sent successfully' });
    } catch (error: any) {
        console.error('Error sending class created email:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to send email' },
            { status: 500 }
        );
    }
}

