import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';
import { sendSessionReminderEmail } from '@/lib/email';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    // Option 1: Use service account from environment variable (JSON string)
    if (process.env.FIREBASE_ADMIN_SDK_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('✅ Firebase Admin initialized using FIREBASE_ADMIN_SDK_KEY');
    } 
    // Option 2: Use GOOGLE_APPLICATION_CREDENTIALS environment variable (path to JSON file)
    else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault()
      });
      console.log('✅ Firebase Admin initialized using GOOGLE_APPLICATION_CREDENTIALS');
    }
    // Option 3: Try to read firebase-service-account.json from project root
    else {
      try {
        const serviceAccountPath = join(process.cwd(), 'firebase-service-account.json');
        const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        console.log('✅ Firebase Admin initialized using firebase-service-account.json');
      } catch (fileError) {
        // Option 4: Try default initialization
        admin.initializeApp();
        console.log('✅ Firebase Admin initialized using default method');
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
  // If time is already formatted (e.g., "10:00 AM"), return as is
  if (timeString && (timeString.includes('AM') || timeString.includes('PM'))) {
    return timeString;
  }
  // Otherwise, try to parse and format
  try {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes || '00'} ${ampm}`;
  } catch (error) {
    return timeString; // Return original if parsing fails
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  let sessionsChecked = 0;
  let remindersSent = 0;
  let remindersSkipped = 0;
  let errors = 0;
  const errorDetails: string[] = [];

  try {
    // Optional: Check API key for security
    const apiKey = request.headers.get('x-api-key');
    if (process.env.CRON_API_KEY && apiKey !== process.env.CRON_API_KEY) {
      console.warn('⚠️ Unauthorized cron request - invalid API key');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🕐 Starting session reminder cron job...');
    console.log('📅 Current time:', new Date().toISOString());

    // Get Firestore instance
    const db = admin.firestore();
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    // Calculate time window: 23-25 hours from now (1-hour window to catch sessions)
    const now = new Date();
    const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000); // 23 hours from now
    const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000); // 25 hours from now

    console.log('🔍 Time window:', {
      start: windowStart.toISOString(),
      end: windowEnd.toISOString(),
    });

    // Convert to Firestore Timestamps
    const startTimestamp = admin.firestore.Timestamp.fromDate(windowStart);
    const endTimestamp = admin.firestore.Timestamp.fromDate(windowEnd);

    // Query upcoming sessions in the time window
    const sessionsRef = db.collection('sessions');
    
    // Note: Firestore doesn't support multiple != queries, so we'll filter cancelled sessions in code
    const sessionsQuery = sessionsRef
      .where('sessionDate', '>=', startTimestamp)
      .where('sessionDate', '<=', endTimestamp);

    const sessionsSnapshot = await sessionsQuery.get();
    console.log(`📊 Found ${sessionsSnapshot.size} sessions in time window`);

    sessionsChecked = sessionsSnapshot.size;

    if (sessionsSnapshot.empty) {
      console.log('✅ No sessions found in time window');
      return NextResponse.json({
        success: true,
        message: 'No sessions found in time window',
        sessionsChecked: 0,
        remindersSent: 0,
        remindersSkipped: 0,
        errors: 0,
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });
    }

    // Process each session
    for (const sessionDoc of sessionsSnapshot.docs) {
      try {
        const session = { id: sessionDoc.id, ...sessionDoc.data() };

        // Skip cancelled or completed sessions
        if (session.status === 'cancelled' || session.status === 'completed') {
          console.log(`⏭️ Skipping ${session.status} session: ${session.id}`);
          continue;
        }

        // Skip sessions without meeting link
        if (!session.meetingLink) {
          console.log(`⏭️ Skipping session without meeting link: ${session.id}`);
          continue;
        }

        // Skip sessions without valid date
        if (!session.sessionDate) {
          console.log(`⏭️ Skipping session without date: ${session.id}`);
          continue;
        }

        console.log(`📅 Processing session: ${session.className} - Session ${session.sessionNumber || 'N/A'}`);

        // Get all active enrollments for this class
        const enrollmentsRef = db.collection('enrollments');
        const enrollmentsQuery = enrollmentsRef
          .where('classId', '==', session.classId)
          .where('status', '==', 'active');

        const enrollmentsSnapshot = await enrollmentsQuery.get();
        console.log(`👥 Found ${enrollmentsSnapshot.size} active enrollments for class ${session.classId}`);

        if (enrollmentsSnapshot.empty) {
          console.log(`⏭️ No active enrollments for session ${session.id}`);
          continue;
        }

        // Process each enrolled student
        for (const enrollmentDoc of enrollmentsSnapshot.docs) {
          try {
            const enrollment = enrollmentDoc.data();

            // Validate enrollment data
            if (!enrollment.studentEmail || !enrollment.studentName) {
              console.warn(`⚠️ Enrollment ${enrollmentDoc.id} missing email or name`);
              continue;
            }

            // Check if reminder already sent for this session+student combination
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

            // Prepare email data
            const sessionDate = session.sessionDate as admin.firestore.Timestamp;
            const formattedDate = formatDateForEmail(sessionDate);
            const formattedTime = formatTimeForEmail(session.sessionTime || '');

            console.log(`📧 Sending reminder to ${enrollment.studentEmail} for session ${session.id}`);

            // Send reminder email
            await sendSessionReminderEmail({
              studentName: enrollment.studentName,
              studentEmail: enrollment.studentEmail,
              studentId: enrollment.studentId,
              className: session.className || enrollment.className || 'Class',
              classId: session.classId,
              sessionDate: formattedDate,
              sessionTime: formattedTime,
              meetingLink: session.meetingLink,
            });

            // Record reminder in database
            await remindersRef.add({
              sessionId: session.id,
              classId: session.classId,
              studentId: enrollment.studentId,
              studentEmail: enrollment.studentEmail,
              studentName: enrollment.studentName,
              sessionDate: sessionDate,
              reminderSentAt: admin.firestore.FieldValue.serverTimestamp(),
              reminderScheduledFor: startTimestamp, // When this reminder was scheduled for
              status: 'sent',
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            remindersSent++;
            console.log(`✅ Reminder sent to ${enrollment.studentEmail}`);

          } catch (studentError: any) {
            errors++;
            const errorMsg = `Error processing student ${enrollmentDoc.id}: ${studentError.message}`;
            console.error(`❌ ${errorMsg}`);
            errorDetails.push(errorMsg);

            // Log failed reminder attempt
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
    console.log(`✅ Cron job completed in ${executionTime}ms`);
    console.log(`📊 Summary: ${sessionsChecked} sessions checked, ${remindersSent} reminders sent, ${remindersSkipped} skipped, ${errors} errors`);

    return NextResponse.json({
      success: true,
      message: 'Session reminders processed',
      sessionsChecked,
      remindersSent,
      remindersSkipped,
      errors,
      errorDetails: errors > 0 ? errorDetails : undefined,
      executionTime,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('❌ Cron job error:', error);
    console.error('Error stack:', error.stack);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process session reminders',
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

// Also support POST for cron services that prefer POST
export async function POST(request: NextRequest) {
  return GET(request);
}

