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

    const now = new Date();

    // ── Window 1: 24h student reminders (23–25 hours from now) ──────────────
    const studentWindowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const studentWindowEnd   = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    // ── Window 2: 30-min creator reminders (25–65 min from now) ─────────────
    // Wide window so we never miss a session when the cron fires up to an hour late
    const creatorWindowStart = new Date(now.getTime() + 25 * 60 * 1000);
    const creatorWindowEnd   = new Date(now.getTime() + 65 * 60 * 1000);

    console.log('🔍 Student 24h window:', { start: studentWindowStart.toISOString(), end: studentWindowEnd.toISOString() });
    console.log('🔍 Creator 30m window:', { start: creatorWindowStart.toISOString(), end: creatorWindowEnd.toISOString() });

    // Combine both windows into a single broad query to minimise Firestore reads
    const broadStart = admin.firestore.Timestamp.fromDate(creatorWindowStart); // earliest
    const broadEnd   = admin.firestore.Timestamp.fromDate(studentWindowEnd);   // latest

    const studentStart = admin.firestore.Timestamp.fromDate(studentWindowStart);
    const studentEnd   = admin.firestore.Timestamp.fromDate(studentWindowEnd);
    const creatorStart = admin.firestore.Timestamp.fromDate(creatorWindowStart);
    const creatorEnd   = admin.firestore.Timestamp.fromDate(creatorWindowEnd);

    const sessionsRef = db.collection('sessions');
    const sessionsQuery = sessionsRef
      .where('sessionDate', '>=', broadStart)
      .where('sessionDate', '<=', broadEnd);

    const sessionsSnapshot = await sessionsQuery.get();
    console.log(`📊 Found ${sessionsSnapshot.size} sessions across both windows`);

    sessionsChecked = sessionsSnapshot.size;

    if (sessionsSnapshot.empty) {
      return NextResponse.json({
        success: true,
        message: 'No sessions found in any window',
        sessionsChecked: 0,
        remindersSent: 0,
        remindersSkipped: 0,
        errors: 0,
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });
    }

    // ── helper: is this session in a given Timestamp window? ─────────────────
    const inWindow = (sessionDate: admin.firestore.Timestamp, lo: admin.firestore.Timestamp, hi: admin.firestore.Timestamp) =>
      sessionDate.toMillis() >= lo.toMillis() && sessionDate.toMillis() <= hi.toMillis();

    // ── keep legacy variable for student path ────────────────────────────────
    const startTimestamp = studentStart;

    // Process each session
    for (const sessionDoc of sessionsSnapshot.docs) {
      try {
        const session: any = { id: sessionDoc.id, ...sessionDoc.data() };

        // Skip cancelled or completed sessions
        if (session.status === 'cancelled' || session.status === 'completed') {
          console.log(`⏭️ Skipping ${session.status} session: ${session.id}`);
          continue;
        }

        if (!session.sessionDate) {
          console.log(`⏭️ Skipping session without date: ${session.id}`);
          continue;
        }

        const sessionDate = session.sessionDate as admin.firestore.Timestamp;
        const formattedDate = formatDateForEmail(sessionDate);
        const formattedTime = formatTimeForEmail(session.sessionTime || '');
        const sessionLabel = `${session.className || 'Class'} — Session ${session.sessionNumber || ''}`;
        const remindersRef = db.collection('session_reminders');

        // ── A. Student 24h reminder ──────────────────────────────────────────
        if (inWindow(sessionDate, studentStart, studentEnd) && session.meetingLink) {
          const enrollmentsSnap = await db.collection('enrollments')
            .where('classId', '==', session.classId)
            .where('status', '==', 'active')
            .get();

          for (const enrollmentDoc of enrollmentsSnap.docs) {
            try {
              const enrollment = enrollmentDoc.data();
              if (!enrollment.studentEmail || !enrollment.studentName) continue;

              // Dedup check
              const alreadySent = await remindersRef
                .where('sessionId', '==', session.id)
                .where('studentId', '==', enrollment.studentId)
                .where('type', '==', '24h')
                .where('status', '==', 'sent')
                .limit(1)
                .get();

              if (!alreadySent.empty) { remindersSkipped++; continue; }

              await sendSessionReminderEmail({
                studentName: enrollment.studentName,
                studentEmail: enrollment.studentEmail,
                studentId: enrollment.studentId,
                className: session.className || 'Class',
                classId: session.classId,
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
                sessionDate,
                type: '24h',
                reminderSentAt: admin.firestore.FieldValue.serverTimestamp(),
                reminderScheduledFor: startTimestamp,
                status: 'sent',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
              });

              remindersSent++;
              console.log(`✅ 24h reminder → ${enrollment.studentEmail}`);
            } catch (err: any) {
              errors++;
              errorDetails.push(`Student 24h reminder ${enrollmentDoc.id}: ${err.message}`);
            }
          }
        }

        // ── B. Creator 30-min in-app + email reminder ────────────────────────
        if (inWindow(sessionDate, creatorStart, creatorEnd) && session.creatorId) {
          try {
            // Dedup check
            const alreadySentCreator = await remindersRef
              .where('sessionId', '==', session.id)
              .where('studentId', '==', session.creatorId)
              .where('type', '==', '30m_creator')
              .where('status', '==', 'sent')
              .limit(1)
              .get();

            if (!alreadySentCreator.empty) {
              console.log(`⏭️ Creator 30m reminder already sent for session ${session.id}`);
              remindersSkipped++;
            } else {
              // In-app notification to creator
              await db.collection('notifications').add({
                userId: session.creatorId,
                userRole: 'creator',
                type: 'session_starting_soon',
                title: `Session Starting in ~30 Minutes`,
                message: `Your session "${sessionLabel}" starts at ${formattedTime} today. Get ready and start the session from your dashboard.`,
                link: '/creator-dashboard',
                relatedId: session.classId,
                isRead: false,
                metadata: {
                  sessionId: session.id,
                  classId: session.classId,
                  sessionNumber: session.sessionNumber,
                  sessionDate: formattedDate,
                  sessionTime: formattedTime,
                  meetingLink: session.meetingLink || '',
                },
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
              });

              // Optional email to creator if they have one
              if (session.creatorEmail) {
                const { Resend } = await import('resend');
                const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
                const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://zefrix.com';

                if (resend) {
                  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:linear-gradient(135deg,#D92A63 0%,#FF654B 100%);padding:30px;text-align:center;border-radius:10px 10px 0 0;">
    <h1 style="color:white;margin:0;">⏰ Session Starting Soon!</h1>
  </div>
  <div style="background:#f9f9f9;padding:30px;border-radius:0 0 10px 10px;">
    <p>Hi ${session.creatorName || 'Creator'},</p>
    <p>Your session is starting in approximately <strong>30 minutes</strong>.</p>
    <div style="background:white;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #D92A63;">
      <p style="margin:0;"><strong>Batch:</strong> ${session.className || 'Class'}</p>
      <p style="margin:8px 0 0;"><strong>Session:</strong> ${session.sessionNumber || ''}</p>
      <p style="margin:8px 0 0;"><strong>Time:</strong> ${formattedTime}</p>
      ${session.meetingLink ? `<p style="margin:8px 0 0;"><strong>Meeting Link:</strong> <a href="${session.meetingLink}" style="color:#D92A63;">${session.meetingLink}</a></p>` : ''}
    </div>
    <div style="text-align:center;margin:24px 0;">
      <a href="${BASE_URL}/creator-dashboard" style="background:linear-gradient(135deg,#D92A63 0%,#FF654B 100%);color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;">Go to Dashboard →</a>
    </div>
    <p>Best regards,<br><strong>The Zefrix Team</strong></p>
  </div>
</body></html>`;

                  await resend.emails.send({
                    from: process.env.FROM_EMAIL || 'notifications@zefrixapp.com',
                    to: session.creatorEmail,
                    subject: `⏰ Session starting in 30 min — ${session.className || 'Class'}`,
                    html,
                  }).catch((e: any) => console.error('Creator reminder email error:', e));
                }
              }

              await remindersRef.add({
                sessionId: session.id,
                classId: session.classId,
                studentId: session.creatorId, // reuse field for creator id
                sessionDate,
                type: '30m_creator',
                reminderSentAt: admin.firestore.FieldValue.serverTimestamp(),
                status: 'sent',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
              });

              remindersSent++;
              console.log(`✅ 30m creator reminder → ${session.creatorId}`);
            }
          } catch (err: any) {
            errors++;
            errorDetails.push(`Creator 30m reminder session ${session.id}: ${err.message}`);
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

