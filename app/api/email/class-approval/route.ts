import { NextRequest, NextResponse } from 'next/server';
import { sendClassApprovalEmail } from '@/lib/email';
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
        const { creatorName, creatorEmail, creatorId, className, classId, status, rejectionReason } = body;

        if (!creatorEmail || !className || !status) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // If creatorId not provided, try to get it from classId
        let finalCreatorId = creatorId;
        if (!finalCreatorId && classId) {
            try {
                const db = admin.firestore();
                const classDoc = await db.collection('classes').doc(classId).get();
                if (classDoc.exists) {
                    finalCreatorId = classDoc.data()?.creatorId;
                }
            } catch (error) {
                console.error('Error fetching creatorId from class:', error);
            }
        }

        await sendClassApprovalEmail({
            creatorName: creatorName || 'Creator',
            creatorEmail,
            creatorId: finalCreatorId,
            className,
            classId: classId || '',
            status: status === 'approved' ? 'approved' : 'rejected',
            rejectionReason,
        });

        return NextResponse.json({ success: true, message: 'Email sent successfully' });
    } catch (error: any) {
        console.error('Error sending class approval email:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to send email' },
            { status: 500 }
        );
    }
}

