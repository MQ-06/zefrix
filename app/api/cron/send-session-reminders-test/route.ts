import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';
import { sendSessionReminderEmail } from '@/lib/email';

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

// Helper function to format date for email
function formatDateForEmail(timestamp: admin.firestore.Timestamp): string {
  const date = timestamp.toDate();
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Helper function to format time for email
function formatTimeForEmail(timeString: string): string {
  if (timeString && (timeString.includes('AM') || timeString.includes('PM'))) {
    return timeString;
  }
  try {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes || '00'} ${ampm}`;
  } catch (error) {
    return timeString;
  }
}

/**
 * TEST ENDPOINT: Checks sessions 1-3 hours in the future (for immediate testing)
 * This is for testing purposes only. Use /send-session-reminders for production.
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  let sessionsChecked = 0;
  let remindersSent = 0;
  let remindersSkipped = 0;
  let errors = 0;
  const errorDetails: string[] = [];

  try {
    console.log('🧪 TEST MODE: Starting session reminder cron job (10 minutes to 3 hour window)...');
    console.log('📅 Current time:', new Date().toISOString());

    const db = admin.firestore();
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    // TEST MODE: Calculate time window: 10 minutes to 3 hours from now (for immediate testing - expanded window)
    const now = new Date();
    const windowStart = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes from now (reduced from 30)
    const windowEnd = new Date(now.getTime() + 3 * 60 * 60 * 1000); // 3 hours from now (increased from 2)

    console.log('🔍 TEST MODE - Time window (10 minutes to 3 hours):', {
      start: windowStart.toISOString(),
      end: windowEnd.toISOString(),
      currentTime: now.toISOString(),
    });

    const startTimestamp = admin.firestore.Timestamp.fromDate(windowStart);
    const endTimestamp = admin.firestore.Timestamp.fromDate(windowEnd);

    const sessionsRef = db.collection('sessions');
    const sessionsQuery = sessionsRef
      .where('sessionDate', '>=', startTimestamp)
      .where('sessionDate', '<=', endTimestamp);

    const sessionsSnapshot = await sessionsQuery.get();
      console.log(`📊 Found ${sessionsSnapshot.size} sessions in test time window (30 minutes to 2 hours)`);

    // DEBUG: Log all sessions in the collection to see what exists
    const allSessionsSnapshot = await db.collection('sessions').limit(10).get();
    console.log(`🔍 DEBUG: Total sessions in database: ${allSessionsSnapshot.size}`);
    allSessionsSnapshot.forEach((doc: any) => {
      const data = doc.data();
      const sessionDate = data.sessionDate?.toDate?.() || data.sessionDate;
      console.log(`   Session ${doc.id}:`, {
        classId: data.classId,
        className: data.className,
        sessionDate: sessionDate ? new Date(sessionDate).toISOString() : 'MISSING',
        sessionTime: data.sessionTime || 'MISSING',
        meetingLink: data.meetingLink ? 'EXISTS' : 'MISSING',
        status: data.status || 'not set',
      });
    });

    sessionsChecked = sessionsSnapshot.size;

    if (sessionsSnapshot.empty) {
      console.log('✅ No sessions found in test time window (30 minutes to 2 hours)');
      console.log(`⏰ Current time: ${now.toISOString()}`);
      console.log(`🔍 Looking for sessions between: ${windowStart.toISOString()} and ${windowEnd.toISOString()}`);
      return NextResponse.json({
        success: true,
        message: 'No sessions found in test time window (30 minutes to 2 hours from now)',
        testMode: true,
        sessionsChecked: 0,
        remindersSent: 0,
        remindersSkipped: 0,
        errors: 0,
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });
    }

    for (const sessionDoc of sessionsSnapshot.docs) {
      try {
        const sessionData = sessionDoc.data();
        const session: any = { id: sessionDoc.id, ...sessionData };

        if (session.status === 'cancelled' || session.status === 'completed') {
          console.log(`⏭️ Skipping ${session.status} session: ${session.id}`);
          continue;
        }

        if (!session.meetingLink) {
          console.log(`⏭️ Skipping session without meeting link: ${session.id}`);
          continue;
        }

        if (!session.sessionDate) {
          console.log(`⏭️ Skipping session without date: ${session.id}`);
          continue;
        }

        console.log(`📅 Processing session: ${session.className} - Session ${session.sessionNumber || 'N/A'}`);
        console.log(`🔍 Session ID: ${session.id}, Class ID: ${session.classId}`);

        const enrollmentsRef = db.collection('enrollments');
        const enrollmentsQuery = enrollmentsRef
          .where('classId', '==', session.classId)
          .where('status', '==', 'active');

        const enrollmentsSnapshot = await enrollmentsQuery.get();
        console.log(`👥 Found ${enrollmentsSnapshot.size} active enrollments for class ${session.classId}`);

        if (enrollmentsSnapshot.empty) {
          console.log(`⏭️ No active enrollments for session ${session.id} (classId: ${session.classId})`);
          console.log(`🔍 DEBUG: Check if enrollments exist with classId="${session.classId}" and status="active"`);
          remindersSkipped++;
          continue;
        }

        for (const enrollmentDoc of enrollmentsSnapshot.docs) {
          try {
            const enrollment = enrollmentDoc.data();

            if (!enrollment.studentEmail || !enrollment.studentName) {
              console.warn(`⚠️ Enrollment ${enrollmentDoc.id} missing email or name`);
              console.warn(`   Email: ${enrollment.studentEmail || 'MISSING'}, Name: ${enrollment.studentName || 'MISSING'}`);
              remindersSkipped++;
              continue;
            }

            const remindersRef = db.collection('session_reminders');
            const existingReminderQuery = remindersRef
              .where('sessionId', '==', session.id)
              .where('studentId', '==', enrollment.studentId)
              .where('status', '==', 'sent')
              .limit(1);

            const existingReminderSnapshot = await existingReminderQuery.get();

            if (!existingReminderSnapshot.empty) {
              console.log(`⏭️ Reminder already sent to ${enrollment.studentEmail} for session ${session.id}`);
              remindersSkipped++;
              continue;
            }

            const sessionDate = session.sessionDate as admin.firestore.Timestamp;
            const formattedDate = formatDateForEmail(sessionDate);
            const formattedTime = formatTimeForEmail(session.sessionTime || '');

            console.log(`📧 TEST MODE - Sending reminder to ${enrollment.studentEmail} for session ${session.id}`);

            await sendSessionReminderEmail({
              studentName: enrollment.studentName,
              studentEmail: enrollment.studentEmail,
              className: session.className || enrollment.className || 'Class',
              sessionDate: formattedDate,
              sessionTime: formattedTime,
              meetingLink: session.meetingLink,
            });

            await remindersRef.add({
              sessionId: session.id,
              classId: session.classId,
              studentId: enrollment.studentId,
              studentEmail: enrollment.studentEmail,
              studentName: enrollment.studentName,
              sessionDate: sessionDate,
              reminderSentAt: admin.firestore.FieldValue.serverTimestamp(),
              reminderScheduledFor: startTimestamp,
              status: 'sent',
              testMode: true,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            remindersSent++;
            console.log(`✅ TEST MODE - Reminder sent to ${enrollment.studentEmail}`);

          } catch (studentError: any) {
            errors++;
            const errorMsg = `Error processing student ${enrollmentDoc.id}: ${studentError.message}`;
            console.error(`❌ ${errorMsg}`);
            errorDetails.push(errorMsg);

            try {
              const remindersRef = db.collection('session_reminders');
              const enrollment = enrollmentDoc.data();
              const sessionDate = session.sessionDate as admin.firestore.Timestamp;

              await remindersRef.add({
                sessionId: session.id,
                classId: session.classId,
                studentId: enrollment.studentId,
                studentEmail: enrollment.studentEmail || 'unknown',
                studentName: enrollment.studentName || 'Unknown',
                sessionDate: sessionDate,
                reminderSentAt: admin.firestore.FieldValue.serverTimestamp(),
                reminderScheduledFor: startTimestamp,
                status: 'failed',
                errorMessage: studentError.message,
                testMode: true,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
              });
            } catch (logError) {
              console.error('Failed to log reminder error:', logError);
            }
          }
        }

      } catch (sessionError: any) {
        errors++;
        const errorMsg = `Error processing session ${sessionDoc.id}: ${sessionError.message}`;
        console.error(`❌ ${errorMsg}`);
        errorDetails.push(errorMsg);
      }
    }

    const executionTime = Date.now() - startTime;
    console.log(`✅ TEST MODE - Cron job completed in ${executionTime}ms`);
    console.log(`📊 Summary: ${sessionsChecked} sessions checked, ${remindersSent} reminders sent, ${remindersSkipped} skipped, ${errors} errors`);

    return NextResponse.json({
      success: true,
      message: 'Session reminders processed (TEST MODE - 10 minutes to 3 hour window)',
      testMode: true,
      sessionsChecked,
      remindersSent,
      remindersSkipped,
      errors,
      errorDetails: errors > 0 ? errorDetails : undefined,
      executionTime,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('❌ TEST MODE - Cron job error:', error);
    console.error('Error stack:', error.stack);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process session reminders',
        testMode: true,
        sessionsChecked,
        remindersSent,
        remindersSkipped,
        errors,
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}

