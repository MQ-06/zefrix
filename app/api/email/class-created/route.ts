import { NextRequest, NextResponse } from 'next/server';
import { sendClassCreatedEmail } from '@/lib/email';
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
    const { creatorId, creatorName, creatorEmail, className, classId, category, price } = body;

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

        // Create notification for all admins
        try {
            const db = admin.firestore();
          let resolvedCreatorId = creatorId;
          if (!resolvedCreatorId && classId) {
            const classDoc = await db.collection('classes').doc(classId).get();
            if (classDoc.exists) {
              resolvedCreatorId = classDoc.data()?.creatorId;
            }
          }

          await createAdminNotification(db, {
            type: 'new_class_submitted',
            title: `New Class Pending Review: ${className}`,
            message: `New class "${className}" submitted by ${creatorName || 'a creator'} needs review.`,
            link: `/admin-dashboard?classId=${classId}`,
            relatedId: classId,
            metadata: {
              className,
              classId,
              creatorId: resolvedCreatorId || null,
              creatorName: creatorName || 'Creator',
              creatorEmail: creatorEmail || '',
              category: category || '',
              price: price || 0,
            },
          });

          if (resolvedCreatorId) {
            await createNotificationForUser(db, String(resolvedCreatorId), 'creator', {
              type: 'class_submission_received',
              title: `Batch Submitted: ${className}`,
              message: `Your batch "${className}" is submitted and pending admin review.`,
              link: '/creator-dashboard?section=manage-classes',
              relatedId: classId,
              metadata: {
                classId,
                className,
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

