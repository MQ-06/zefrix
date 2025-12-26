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

const db = admin.firestore();

// Helper function to generate Google Meet link (placeholder)
function generateMeetingLink(): string {
  // In production, you might integrate with Google Meet API
  // For now, return a placeholder that creator can update
  return `https://meet.google.com/${Math.random().toString(36).substring(2, 15)}`;
}

// Helper function to get day name from date
function getDayName(date: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

export async function POST(request: NextRequest) {
  try {
    const { classId } = await request.json();

    if (!classId) {
      return NextResponse.json(
        { success: false, error: 'Class ID is required' },
        { status: 400 }
      );
    }

    // Get class data
    const classDoc = await db.collection('classes').doc(classId).get();
    if (!classDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Class not found' },
        { status: 404 }
      );
    }

    const classData = classDoc.data();
    if (!classData) {
      return NextResponse.json(
        { success: false, error: 'Class data not found' },
        { status: 404 }
      );
    }

    // Only generate sessions for approved classes
    if (classData.status !== 'approved') {
      return NextResponse.json(
        { success: false, error: 'Class must be approved before generating sessions' },
        { status: 400 }
      );
    }

    const scheduleType = classData.scheduleType;
    const sessionsCreated: any[] = [];

    if (scheduleType === 'one-time') {
      // Create single session for one-time class
      const date = classData.date as string;
      const startTime = classData.startTime as string;
      
      if (!date || !startTime) {
        return NextResponse.json(
          { success: false, error: 'Missing date or start time for one-time session' },
          { status: 400 }
        );
      }

      // Combine date and time
      const sessionDateTime = new Date(`${date}T${startTime}`);
      const sessionTime = classData.startTime || startTime;

      const sessionData = {
        classId: classId,
        className: classData.title,
        creatorId: classData.creatorId,
        creatorName: classData.creatorName,
        sessionNumber: 1,
        sessionDate: admin.firestore.Timestamp.fromDate(sessionDateTime),
        sessionTime: sessionTime,
        meetingLink: generateMeetingLink(),
        status: 'scheduled',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const sessionRef = await db.collection('sessions').add(sessionData);
      sessionsCreated.push({ id: sessionRef.id, ...sessionData });
    } else if (scheduleType === 'recurring') {
      // Generate sessions for recurring batch
      const startDate = new Date(classData.startDate as string);
      const endDate = new Date(classData.endDate as string);
      const selectedDays = classData.days as string[] || [];
      const recurringStartTime = classData.recurringStartTime as string;
      const recurringEndTime = classData.recurringEndTime as string;

      if (!startDate || !endDate || !selectedDays.length || !recurringStartTime) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields for recurring batch' },
          { status: 400 }
        );
      }

      // Generate sessions for each selected day between start and end date
      let sessionNumber = 1;
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dayName = getDayName(currentDate);

        if (selectedDays.includes(dayName)) {
          // Combine date and time
          const sessionDateTime = new Date(currentDate);
          const [hours, minutes] = recurringStartTime.split(':').map(Number);
          sessionDateTime.setHours(hours, minutes, 0, 0);

          const sessionData = {
            classId: classId,
            className: classData.title,
            creatorId: classData.creatorId,
            creatorName: classData.creatorName,
            sessionNumber: sessionNumber,
            sessionDate: admin.firestore.Timestamp.fromDate(sessionDateTime),
            sessionTime: recurringStartTime,
            meetingLink: generateMeetingLink(),
            status: 'scheduled',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          };

          const sessionRef = await db.collection('sessions').add(sessionData);
          sessionsCreated.push({ id: sessionRef.id, ...sessionData });
          sessionNumber++;
        }

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid schedule type' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created ${sessionsCreated.length} session(s)`,
      sessionsCreated: sessionsCreated.length,
      sessions: sessionsCreated,
    });

  } catch (error: any) {
    console.error('Error generating sessions:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate sessions' },
      { status: 500 }
    );
  }
}

