# Automated Session Reminder Emails - Implementation Plan

## Overview
Implement automated email reminders sent to students 24 hours before their scheduled class sessions.

---

## 1. Architecture Approach

### Option A: API Route + External Cron Service (Recommended)
**How it works:**
- Create an API route: `/api/cron/send-session-reminders`
- External cron service (e.g., cron-job.org, EasyCron, or Hostinger cron) calls this endpoint periodically
- API route checks for sessions 24 hours in the future and sends reminders
- Simple, works with any hosting provider, no additional infrastructure needed

**Pros:**
- ✅ Simple implementation
- ✅ Works with Hostinger hosting
- ✅ No additional services needed
- ✅ Easy to test manually
- ✅ Can add authentication header for security

**Cons:**
- ⚠️ Requires external cron service setup
- ⚠️ API route timeout limits (Vercel: 10s, Hostinger: varies)

---

### Option B: Next.js API Route + Vercel Cron (If on Vercel)
**How it works:**
- Create API route: `/api/cron/send-session-reminders`
- Use Vercel Cron Jobs in `vercel.json` to schedule it
- Automatically triggered by Vercel infrastructure

**Pros:**
- ✅ Native Vercel integration
- ✅ No external services needed
- ✅ Built-in scheduling

**Cons:**
- ❌ Only works on Vercel
- ❌ Not available if hosting on Hostinger

---

### Option C: Firebase Cloud Functions (Advanced)
**How it works:**
- Create Firebase Cloud Function with scheduled trigger
- Runs on Google Cloud infrastructure
- Most scalable option

**Pros:**
- ✅ Scalable
- ✅ No timeout issues
- ✅ Integrated with Firebase

**Cons:**
- ❌ Requires Firebase Functions setup
- ❌ More complex
- ❌ Additional costs (Firebase Functions)

---

## Recommended: Option A (API Route + External Cron)

Since you're hosting on Hostinger, **Option A is the best fit**. It's simple, works everywhere, and Hostinger typically supports cron jobs.

---

## 2. Data Structure Analysis

### Sessions Collection Structure
Based on code analysis, sessions are stored in `sessions` collection with:
```typescript
{
  id: string; // Auto-generated doc ID
  classId: string;
  className: string;
  sessionNumber: number;
  sessionDate: Timestamp; // When session occurs
  sessionTime: string; // e.g., "10:00 AM"
  meetingLink: string; // Google Meet link
  status?: string; // scheduled, ongoing, completed, cancelled
  createdAt: Timestamp;
  // ... other fields
}
```

### Enrollments Collection Structure
```typescript
{
  studentId: string;
  studentEmail: string;
  studentName: string;
  classId: string;
  className: string;
  status: 'active' | 'refunded' | 'cancelled';
  enrolledAt: Timestamp;
  // ... other fields
}
```

---

## 3. Implementation Details

### Step 1: Create Reminder Tracking Collection

**New Collection: `session_reminders`**
```typescript
{
  reminderId: string; // Auto-generated
  sessionId: string; // Reference to sessions collection
  classId: string;
  studentId: string;
  studentEmail: string;
  studentName: string;
  sessionDate: Timestamp; // When session occurs
  reminderSentAt: Timestamp; // When reminder was sent
  reminderScheduledFor: Timestamp; // 24 hours before session (for tracking)
  status: 'sent' | 'failed' | 'pending';
  emailMessageId?: string; // For tracking
  errorMessage?: string; // If failed
}
```

**Purpose:**
- Prevent duplicate reminders (check if reminder already sent for session+student)
- Track reminder delivery status
- Audit trail

---

### Step 2: API Route Logic

**Route: `/api/cron/send-session-reminders`**

**Algorithm:**
1. **Authentication Check**
   - Optional: Add API key header for security
   - Or: Allow unauthenticated but log IP/headers

2. **Query Upcoming Sessions**
   - Get current time
   - Calculate 24 hours from now: `now + 24 hours`
   - Query `sessions` collection where:
     - `sessionDate` is between `now + 23 hours` and `now + 25 hours` (1-hour window)
     - `status` is not 'cancelled' or 'completed'
     - `meetingLink` exists

3. **For Each Upcoming Session:**
   - Get all active enrollments for that `classId`
   - For each enrolled student:
     - Check if reminder already sent (query `session_reminders` collection)
     - If not sent:
       - Send email using `sendSessionReminderEmail()`
       - Create record in `session_reminders` collection
       - Mark as 'sent' or 'failed'

4. **Error Handling**
   - Log all errors
   - Continue processing other sessions even if one fails
   - Return summary (sessions checked, reminders sent, errors)

---

### Step 3: Email Sending Logic

**Function: `sendSessionReminderEmail()` (already exists in `lib/email.ts`)**

**Data Needed:**
- `studentName`: From enrollment
- `studentEmail`: From enrollment
- `className`: From session or enrollment
- `sessionDate`: Format as readable date string
- `sessionTime`: From session document
- `meetingLink`: From session document

**Date Formatting:**
- Convert Firestore Timestamp to readable format
- Example: "Tuesday, January 15, 2024"
- Include time: "10:00 AM IST" (or appropriate timezone)

---

### Step 4: Cron Schedule Configuration

**Recommended Schedule: Every Hour**

**Why every hour?**
- Catches sessions exactly 24 hours before
- Accounts for any timing variations
- Lightweight (only processes sessions in 1-hour window)

**Alternative: Every 30 minutes**
- More precise
- Slightly more API calls

**Cron Expression:**
- Every hour: `0 * * * *` (at minute 0 of every hour)
- Every 30 minutes: `*/30 * * * *`

---

### Step 5: Timezone Handling

**Current Approach:**
- Use server timezone (UTC recommended)
- Calculate 24 hours based on UTC
- Convert session dates from Firestore Timestamps (which are UTC)

**Edge Cases:**
- Sessions created in different timezones: Firestore Timestamps are UTC, so consistent
- Student timezone: Can mention in email "10:00 AM IST" but calculate in UTC

**Future Enhancement:**
- Store student timezone preference
- Convert session time to student's timezone in email

---

## 4. Edge Cases & Error Handling

### Edge Case 1: Multiple Reminders
**Problem:** Cron runs multiple times, might send duplicate reminders
**Solution:** Check `session_reminders` collection before sending

### Edge Case 2: Session Cancelled After Reminder Sent
**Problem:** Reminder sent, then session cancelled
**Solution:** Check session status before sending (already handled in query)

### Edge Case 3: Student Unenrolled
**Problem:** Reminder sent to student who unenrolled
**Solution:** Only query active enrollments (`status == 'active'`)

### Edge Case 4: Missing Meeting Link
**Problem:** Session exists but no meeting link
**Solution:** Skip sessions without `meetingLink` in query filter

### Edge Case 5: Email Sending Failure
**Problem:** Resend API fails
**Solution:** 
- Log error in `session_reminders` collection
- Mark status as 'failed'
- Don't retry automatically (avoid spam)
- Admin can manually retry if needed

### Edge Case 6: Session Date Changed
**Problem:** Creator changes session date after reminder sent
**Solution:** 
- New date = new reminder (different `reminderScheduledFor` timestamp)
- Old reminder stays in database (for audit)

### Edge Case 7: Bulk Sessions (Same Class, Same Time)
**Problem:** Multiple students enrolled, sending many emails
**Solution:** 
- Process sequentially or in batches
- Add delay between emails if needed (Resend rate limits)
- Use Promise.all for parallel sending (Resend allows this)

### Edge Case 8: Time Window Overlap
**Problem:** Session at exactly 24 hours, cron runs twice
**Solution:** 1-hour window (23-25 hours) ensures we catch it, but duplicate check prevents double-sending

---

## 5. Security Considerations

### API Route Protection

**Option 1: API Key (Recommended)**
```typescript
// Check header
const apiKey = request.headers.get('x-api-key');
if (apiKey !== process.env.CRON_API_KEY) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**Option 2: Secret Token in URL (Less Secure)**
```
/api/cron/send-session-reminders?token=SECRET_TOKEN
```

**Option 3: IP Whitelist (If cron service provides fixed IP)**
- Check `request.ip` or headers
- Only allow specific IPs

**Option 4: No Protection (Acceptable for MVP)**
- Add logging to track calls
- Monitor for abuse
- Can add protection later

---

## 6. Implementation Steps

### Phase 1: Database Setup
1. ✅ Verify `sessions` collection structure
2. ✅ Verify `enrollments` collection structure
3. Create Firestore rules for `session_reminders` collection

### Phase 2: API Route
1. Create `/api/cron/send-session-reminders/route.ts`
2. Implement query logic for upcoming sessions
3. Implement enrollment fetching
4. Implement duplicate check
5. Implement email sending
6. Add error handling and logging

### Phase 3: Testing
1. Test with manual API calls
2. Test with future sessions (mock data)
3. Test duplicate prevention
4. Test error scenarios

### Phase 4: Cron Setup
1. Choose cron service (cron-job.org recommended)
2. Configure cron job to call API route
3. Test with real schedule
4. Monitor logs

### Phase 5: Monitoring
1. Add logging for tracking
2. Monitor reminder delivery
3. Set up alerts for failures

---

## 7. API Route Pseudo-Code

```typescript
export async function GET(request: NextRequest) {
  try {
    // 1. Optional: Check API key
    const apiKey = request.headers.get('x-api-key');
    if (process.env.CRON_API_KEY && apiKey !== process.env.CRON_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Initialize Firebase Admin SDK (server-side)
    // Get Firestore instance

    // 3. Calculate time window
    const now = new Date();
    const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000); // 23 hours
    const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000); // 25 hours

    // 4. Query upcoming sessions
    const sessionsRef = admin.firestore().collection('sessions');
    const upcomingSessions = await sessionsRef
      .where('sessionDate', '>=', admin.firestore.Timestamp.fromDate(windowStart))
      .where('sessionDate', '<=', admin.firestore.Timestamp.fromDate(windowEnd))
      .where('status', '!=', 'cancelled')
      .where('meetingLink', '!=', null)
      .get();

    let remindersSent = 0;
    let errors = 0;

    // 5. For each session
    for (const sessionDoc of upcomingSessions.docs) {
      const session = { id: sessionDoc.id, ...sessionDoc.data() };
      
      // Get active enrollments for this class
      const enrollmentsRef = admin.firestore().collection('enrollments');
      const enrollments = await enrollmentsRef
        .where('classId', '==', session.classId)
        .where('status', '==', 'active')
        .get();

      // For each enrolled student
      for (const enrollmentDoc of enrollments.docs) {
        const enrollment = enrollmentDoc.data();
        
        // Check if reminder already sent
        const remindersRef = admin.firestore().collection('session_reminders');
        const existingReminder = await remindersRef
          .where('sessionId', '==', session.id)
          .where('studentId', '==', enrollment.studentId)
          .where('status', '==', 'sent')
          .limit(1)
          .get();

        if (!existingReminder.empty) {
          continue; // Already sent, skip
        }

        try {
          // Send email
          await sendSessionReminderEmail({
            studentName: enrollment.studentName,
            studentEmail: enrollment.studentEmail,
            className: session.className || enrollment.className,
            sessionDate: formatDate(session.sessionDate),
            sessionTime: session.sessionTime,
            meetingLink: session.meetingLink,
          });

          // Record reminder
          await remindersRef.add({
            sessionId: session.id,
            classId: session.classId,
            studentId: enrollment.studentId,
            studentEmail: enrollment.studentEmail,
            studentName: enrollment.studentName,
            sessionDate: session.sessionDate,
            reminderSentAt: admin.firestore.FieldValue.serverTimestamp(),
            reminderScheduledFor: admin.firestore.Timestamp.fromDate(windowStart),
            status: 'sent',
          });

          remindersSent++;
        } catch (error) {
          // Log failed reminder
          await remindersRef.add({
            sessionId: session.id,
            classId: session.classId,
            studentId: enrollment.studentId,
            studentEmail: enrollment.studentEmail,
            studentName: enrollment.studentName,
            sessionDate: session.sessionDate,
            reminderSentAt: admin.firestore.FieldValue.serverTimestamp(),
            reminderScheduledFor: admin.firestore.Timestamp.fromDate(windowStart),
            status: 'failed',
            errorMessage: error.message,
          });

          errors++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      sessionsChecked: upcomingSessions.size,
      remindersSent,
      errors,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

---

## 8. Firestore Security Rules

```javascript
match /session_reminders/{reminderId} {
  // Only server (via Firebase Admin) can write
  // Users can read their own reminders
  allow read: if request.auth != null && 
                 request.auth.uid == resource.data.studentId;
  
  // Admins can read all
  allow read: if request.auth != null && 
                 get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
  
  // No client-side writes (only via Admin SDK in API route)
  allow write: if false;
}
```

---

## 9. Testing Strategy

### Manual Testing
1. Create test session 24 hours in future
2. Create test enrollment
3. Call API route manually: `GET /api/cron/send-session-reminders`
4. Verify email sent
5. Verify reminder record created
6. Call again to verify no duplicate

### Automated Testing
1. Unit tests for time window calculation
2. Unit tests for duplicate check logic
3. Integration test with mock Firestore

---

## 10. Monitoring & Logging

### Logging Points
- API route called
- Sessions found in window
- Reminders sent (count)
- Errors (with details)
- Performance metrics (execution time)

### Monitoring
- Check cron service logs (calls made)
- Check server logs (API route execution)
- Monitor Resend dashboard (email delivery)
- Check `session_reminders` collection for failures

---

## 11. Future Enhancements

1. **Multiple Reminder Times**
   - 24 hours before
   - 1 hour before
   - Customizable per class

2. **Timezone Support**
   - Store student timezone
   - Convert session time to student timezone

3. **SMS Reminders**
   - Add SMS option (Twilio, etc.)

4. **Push Notifications**
   - Browser push notifications
   - Mobile app notifications

5. **Reminder Preferences**
   - Allow students to opt-out
   - Customize reminder timing

---

## Summary

**Recommended Approach:** API Route + External Cron Service (Option A)

**Key Components:**
1. New Firestore collection: `session_reminders`
2. API route: `/api/cron/send-session-reminders`
3. Cron service: External service calling API every hour
4. Email function: Already exists (`sendSessionReminderEmail`)

**Time to Implement:** 3-4 hours
**Complexity:** Medium
**Dependencies:** Firebase Admin SDK, Resend (already configured)

**Next Steps:**
1. Review and approve this plan
2. Implement API route
3. Set up cron service
4. Test with real data
5. Monitor and iterate

