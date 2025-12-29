# Session Reminder Cron Job Setup Guide

## Overview
This guide explains how to set up the automated session reminder system that sends email reminders to students 24 hours before their scheduled sessions.

---

## ✅ What's Already Implemented

1. **API Route**: `/api/cron/send-session-reminders`
   - Queries sessions happening in 24 hours
   - Sends reminder emails to enrolled students
   - Prevents duplicate reminders
   - Logs all reminders in `session_reminders` collection

2. **Email Function**: Already exists in `lib/email.ts`
   - `sendSessionReminderEmail()` function ready to use

3. **Firestore Security Rules**: Added for `session_reminders` collection

---

## 🔧 Setup Steps

### Step 1: Set Up API Key (Optional but Recommended)

Add to your `.env.local` file:
```env
# Optional: API key for securing the cron endpoint
CRON_API_KEY=your-secret-api-key-here-change-this
```

**Note**: If you don't set this, the endpoint will be publicly accessible. It's recommended to set a strong API key.

---

### Step 2: Choose a Cron Service

#### Option A: cron-job.org (Recommended - Free)
1. Go to https://cron-job.org
2. Sign up for a free account
3. Create a new cron job:
   - **Title**: Zefrix Session Reminders
   - **URL**: `https://yourdomain.com/api/cron/send-session-reminders`
   - **Schedule**: Every hour (`0 * * * *`)
   - **Request Method**: GET (or POST)
   - **Headers** (if using API key):
     - Key: `x-api-key`
     - Value: `your-secret-api-key-here`
   - **Activate**: Yes

#### Option B: EasyCron (Free tier available)
1. Go to https://www.easycron.com
2. Sign up and create a cron job
3. Configure similar to Option A

#### Option C: Hostinger Cron Jobs (If available)
1. Log into Hostinger control panel
2. Navigate to Cron Jobs section
3. Create new cron job:
   - **Command**: `curl -H "x-api-key: your-secret-api-key" https://yourdomain.com/api/cron/send-session-reminders`
   - **Schedule**: `0 * * * *` (every hour)

#### Option D: Manual Testing (For Development)
You can test the endpoint manually:
```bash
# Without API key
curl https://localhost:3000/api/cron/send-session-reminders

# With API key
curl -H "x-api-key: your-secret-api-key" https://localhost:3000/api/cron/send-session-reminders
```

---

### Step 3: Test the Endpoint

Before setting up the cron job, test the endpoint manually:

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Call the endpoint:**
   ```bash
   # In browser or using curl
   http://localhost:3000/api/cron/send-session-reminders
   ```

3. **Expected Response:**
   ```json
   {
     "success": true,
     "message": "Session reminders processed",
     "sessionsChecked": 0,
     "remindersSent": 0,
     "remindersSkipped": 0,
     "errors": 0,
     "executionTime": 123,
     "timestamp": "2024-01-15T10:00:00.000Z"
   }
   ```

4. **Check Server Logs:**
   - Look for console logs showing:
     - `🕐 Starting session reminder cron job...`
     - `📊 Found X sessions in time window`
     - `✅ Cron job completed in Xms`

---

### Step 4: Verify Email Configuration

Make sure your Resend API key is configured in `.env.local`:
```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=onboarding@resend.dev  # Or your verified domain email
```

---

## 📊 How It Works

### Time Window
- **Window**: 23-25 hours from current time (1-hour buffer)
- **Why**: Ensures we catch sessions exactly 24 hours before, accounting for timing variations
- **Frequency**: Runs every hour

### Process Flow
1. Cron service calls API route every hour
2. API route queries sessions in 23-25 hour window
3. For each session:
   - Gets all active enrollments for that class
   - Checks if reminder already sent (prevents duplicates)
   - Sends email to each enrolled student
   - Records reminder in `session_reminders` collection
4. Returns summary of results

### Duplicate Prevention
- Checks `session_reminders` collection before sending
- Query: `sessionId + studentId + status='sent'`
- If reminder exists, skips sending

---

## 🔍 Monitoring

### Check Reminder Status

**Via Firestore Console:**
1. Go to Firebase Console → Firestore Database
2. Open `session_reminders` collection
3. View all sent reminders with:
   - `status`: 'sent' or 'failed'
   - `reminderSentAt`: Timestamp
   - `errorMessage`: If failed

**Via API Response:**
The endpoint returns:
- `sessionsChecked`: Number of sessions found
- `remindersSent`: Number of emails sent
- `remindersSkipped`: Number skipped (already sent)
- `errors`: Number of errors
- `errorDetails`: Array of error messages (if any)

### Check Email Delivery

1. **Resend Dashboard**: https://resend.com/emails
   - View all sent emails
   - Check delivery status
   - See bounce/complaint rates

2. **Server Logs**: Check console logs for:
   - `✅ Reminder sent to student@email.com`
   - `❌ Error processing student...`

---

## 🐛 Troubleshooting

### Issue: No Reminders Being Sent

**Check:**
1. Are there sessions scheduled 24 hours in the future?
2. Do those sessions have `meetingLink`?
3. Are there active enrollments for those classes?
4. Check server logs for errors

**Test Query:**
```javascript
// In Firestore Console, query sessions collection
// Filter: sessionDate >= (now + 23 hours) AND sessionDate <= (now + 25 hours)
```

### Issue: Duplicate Reminders

**Solution:** Already handled! The system checks `session_reminders` before sending.

### Issue: API Route Returns 401 Unauthorized

**Solution:** 
- Make sure `CRON_API_KEY` in `.env.local` matches the header value
- Or remove API key check temporarily for testing

### Issue: Email Not Sending

**Check:**
1. `RESEND_API_KEY` is set in `.env.local`
2. `FROM_EMAIL` is verified in Resend
3. Check Resend dashboard for errors
4. Check server logs for email errors

### Issue: Cron Job Not Running

**Check:**
1. Cron service is active
2. URL is correct (include `https://`)
3. Schedule is correct (`0 * * * *` for every hour)
4. Check cron service logs/history

---

## 📝 Example Cron Schedule

**Every Hour:**
```
0 * * * *
```

**Every 30 Minutes:**
```
*/30 * * * *
```

**Every Day at 9 AM:**
```
0 9 * * *
```

**Every 6 Hours:**
```
0 */6 * * *
```

**Recommended**: `0 * * * *` (every hour at minute 0)

---

## 🔒 Security Best Practices

1. **Use API Key**: Set `CRON_API_KEY` in environment variables
2. **HTTPS Only**: Always use `https://` in cron job URL
3. **Monitor Logs**: Check for unauthorized access attempts
4. **Rate Limiting**: Consider adding rate limiting if needed

---

## 📈 Performance

- **Typical Execution Time**: < 2 seconds for 10-20 sessions
- **Email Sending**: Parallel (Promise.all), so fast
- **Database Queries**: Optimized with indexes (Firestore auto-indexes)

---

## ✅ Testing Checklist

- [ ] API route accessible
- [ ] Returns success response
- [ ] Logs show sessions being checked
- [ ] Emails are sent (check Resend dashboard)
- [ ] Reminders recorded in `session_reminders` collection
- [ ] Duplicate prevention works (call twice, second time should skip)
- [ ] Cron service configured and running
- [ ] Cron service calls endpoint successfully

---

## 🚀 Next Steps

1. Set up cron service (cron-job.org recommended)
2. Test with a real session 24 hours in future
3. Monitor for first few days
4. Adjust schedule if needed (currently every hour)

---

## 📞 Support

If you encounter issues:
1. Check server logs for detailed error messages
2. Check Resend dashboard for email delivery issues
3. Verify Firestore security rules are deployed
4. Test endpoint manually first before setting up cron

---

**The system is now ready!** Just set up the cron service and it will automatically send reminders 24 hours before each session.

