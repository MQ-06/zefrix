import { NextRequest, NextResponse } from 'next/server';
import { sendClassApprovalEmail } from '@/lib/email';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  createAdminNotification,
  createNotificationForRole,
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
        const { creatorName, creatorEmail, creatorId, className, classId, status, rejectionReason } = body;

        if (!creatorEmail || !className || !status) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Ensure creatorId is always available - fetch from batch if not provided
        let finalCreatorId = creatorId;
        if (!finalCreatorId && classId) {
            try {
                const db = admin.firestore();
                const classDoc = await db.collection('classes').doc(classId).get();
                if (classDoc.exists) {
                    const classData = classDoc.data();
                    finalCreatorId = classData?.creatorId;
                    console.log('✅ Fetched creatorId from class:', finalCreatorId);
                }
            } catch (error) {
                console.error('❌ Error fetching creatorId from class:', error);
            }
        }
        
        if (!finalCreatorId) {
            console.warn('⚠️ WARNING: No creatorId available for notification. creatorId:', creatorId, 'classId:', classId);
            console.warn('⚠️ Email will still be sent, but notification will be skipped');
        } else {
            console.log('📝 Creating approval notification - creatorId:', finalCreatorId, 'classId:', classId, 'status:', status, 'className:', className);
        }

        // Send email and create notification (creatorId is optional - notification will be skipped if not available)
        await sendClassApprovalEmail({
            creatorName: creatorName || 'Creator',
            creatorEmail,
            creatorId: finalCreatorId, // May be undefined - sendClassApprovalEmail handles this gracefully
            className,
            classId: classId || '',
            status: status === 'approved' ? 'approved' : 'rejected',
            rejectionReason,
        });

          try {
            const db = admin.firestore();

            await createAdminNotification(db, {
              type: status === 'approved' ? 'admin_class_approved' : 'admin_class_rejected',
              title: status === 'approved' ? `Batch Approved: ${className}` : `Batch Rejected: ${className}`,
              message:
                status === 'approved'
                  ? `Batch "${className}" is now live.`
                  : `Batch "${className}" was rejected and sent for revision.`,
              link: '/admin-dashboard?page=approve-batches',
              relatedId: classId || '',
              metadata: {
                classId: classId || '',
                className,
                creatorId: finalCreatorId || null,
                creatorEmail,
                creatorName: creatorName || 'Creator',
                status,
                rejectionReason: rejectionReason || null,
              },
            });

            if (status === 'approved') {
              const livePayload = {
                type: 'batch_live',
                title: `New Batch Live: ${className}`,
                message: `"${className}" by ${creatorName || 'a creator'} is now live for enrollment.`,
                link: '/batches',
                relatedId: classId || '',
                metadata: {
                  classId: classId || '',
                  className,
                  creatorId: finalCreatorId || null,
                  creatorName: creatorName || 'Creator',
                },
              };

              await Promise.all([
                createNotificationForRole(db, 'student', livePayload),
                createNotificationForRole(db, 'creator', livePayload),
                createNotificationForRole(db, 'admin', livePayload),
              ]);
            }
          } catch (fanoutError) {
            console.error('Error creating class-approval fanout notifications:', fanoutError);
          }

        return NextResponse.json({ 
            success: true, 
            message: finalCreatorId ? 'Email and notification sent successfully' : 'Email sent successfully (notification skipped - no creatorId)',
            notificationSent: !!finalCreatorId
        });
    } catch (error: any) {
        console.error('Error sending class approval email:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to send email' },
            { status: 500 }
        );
    }
}

