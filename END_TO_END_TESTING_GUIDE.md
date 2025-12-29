# 🧪 Zefrix - Complete End-to-End Testing Guide

## 📋 Prerequisites

### 1. Environment Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# App will run on: http://localhost:3000
```

### 2. Test Accounts Needed
- **Admin**: `kartik@zefrix.com` (auto-assigned admin role)
- **Creator**: Any email (sign up → become creator)
- **Student**: Any email (sign up as regular user)

### 3. Test Payment Setup
- Use Razorpay Test Keys (already configured)
- Test Card: `4111 1111 1111 1111`
- Any future expiry date, any CVV

---

## 🎯 TESTING FLOW 1: STUDENT JOURNEY

### Step 1: Browse Classes (Unauthenticated)
1. Go to `http://localhost:3000`
2. **Landing Page** should show:
   - ✅ Hero section with "Join Your First Class"
   - ✅ Featured Categories section
   - ✅ Featured Courses section
   - ✅ Testimonials/FAQ sections
   - ✅ "Explore Classes" button
   - ✅ "Sign Up / Login" button
   - ✅ "Become a Creator" button

3. Click **"Explore Classes"** or go to `/courses`
4. **Courses Page** should show:
   - ✅ List of approved classes
   - ✅ Filter by category
   - ✅ Search functionality
   - ✅ Class cards with thumbnail, title, creator, price

5. Click on a **category** from navigation
6. **Category Page** should show:
   - ✅ Classes filtered by that category
   - ✅ Category name and description

7. Click on a **class card**
8. **Class Detail Page** (`/product/[classId]`) should show:
   - ✅ Class title, description, creator info
   - ✅ Schedule information
   - ✅ Price
   - ✅ "Add to Cart" or "Enroll Now" button
   - ✅ Reviews/ratings section

### Step 2: Sign Up as Student
1. Click **"Sign Up / Login"** or go to `/signup-login`
2. Click **"Sign Up"** tab
3. Fill in:
   - Name: `Test Student`
   - Email: `student@test.com` (or any email)
   - Password: `test123456`
4. Click **"Sign Up"**
5. ✅ Should see "Sign up successful! Redirecting..." toast
6. ✅ Should redirect to `/student-dashboard`

### Step 3: Student Dashboard
1. **Dashboard View** should show:
   - ✅ Welcome message with student name
   - ✅ Upcoming sessions (if enrolled)
   - ✅ Browse classes section
   - ✅ Search and filter options

2. **Notifications** (sidebar):
   - ✅ Click "Notifications"
   - ✅ Should show notification list (empty initially)
   - ✅ Badge count should be visible if unread notifications exist

3. **Upcoming Sessions** (sidebar):
   - ✅ Click "Upcoming Sessions"
   - ✅ Shows enrolled classes with upcoming session dates
   - ✅ "Join Class" button when session is live

4. **My Enrollments** (sidebar):
   - ✅ Click "My Enrollments"
   - ✅ Shows all enrolled classes
   - ✅ Can rate/leave feedback for completed classes

### Step 4: Enroll in a Class
1. Go back to **Dashboard** or `/courses`
2. Click on a class card
3. On class detail page, click **"Add to Cart"** or **"Enroll Now"**
4. If cart is used:
   - ✅ Item added to cart
   - ✅ Cart count updates in header
   - Go to `/checkout`
5. If direct enrollment:
   - ✅ Redirects to `/checkout` immediately

### Step 5: Checkout & Payment
1. **Checkout Page** (`/checkout`) should show:
   - ✅ List of classes in cart
   - ✅ Total amount
   - ✅ Payment form (Razorpay)

2. Click **"Proceed to Payment"**
3. **Razorpay Modal** opens:
   - ✅ Enter test card: `4111 1111 1111 1111`
   - ✅ Any future expiry (e.g., 12/25)
   - ✅ Any CVV (e.g., 123)
   - ✅ Enter name and click "Pay"

4. **Payment Success**:
   - ✅ Redirects to `/thank-you?status=success`
   - ✅ Shows success message
   - ✅ Email sent to student (check console for email logs)
   - ✅ Notification created for student

5. Go back to **Student Dashboard**
   - ✅ Class should appear in "My Enrollments"
   - ✅ Upcoming sessions should show
   - ✅ Notification badge should show new notification

### Step 6: Join Live Class
1. Wait for session time OR create a session that starts soon
2. In **Student Dashboard** → **Upcoming Sessions**:
   - ✅ Session should appear with date/time
   - ✅ "Join Class" button appears when session is live
3. Click **"Join Class"**
4. ✅ Should open Google Meet link in new tab
5. ✅ Can participate in live session

### Step 7: Rate & Review
1. After class ends, go to **My Enrollments**
2. Find the completed class
3. Click **"Rate & Review"** or rating button
4. Fill in:
   - Rating: 1-5 stars
   - Feedback: "Great class!"
5. Submit
6. ✅ Rating saved
7. ✅ Notification sent to creator
8. ✅ Rating appears on class detail page

---

## 🎨 TESTING FLOW 2: CREATOR JOURNEY

### Step 1: Become a Creator
1. Go to `/user-pages/become-a-creator`
2. Fill in creator profile:
   - Full Name: `Test Creator`
   - Email: `creator@test.com`
   - WhatsApp: `+91 1234567890`
   - Category: Select one (e.g., "Design & Creativity")
   - Sub Category: Type custom (e.g., "UI/UX Design")
   - Bio: "I'm a professional designer..."
   - Expertise: "10 years in design"
   - Intro Video URL: (optional) YouTube link
   - Profile Image: Upload image (or URL)
   - Social Handles: (optional)
   - Password: `test123456`
3. Click **"Sign Up"**
4. ✅ Should create account with `role: 'creator'`
5. ✅ Redirects to `/creator-dashboard`

### Step 2: Creator Dashboard Overview
1. **Dashboard** should show:
   - ✅ Welcome message
   - ✅ Approved classes grid
   - ✅ Pending classes (if any)
   - ✅ Quick stats

2. **Sidebar Navigation**:
   - ✅ Dashboard
   - ✅ Notifications (with badge if unread)
   - ✅ Analytics
   - ✅ Create Class
   - ✅ Manage Classes
   - ✅ Enrollments
   - ✅ Profile

### Step 3: Create a Class
1. Click **"Create Class"** in sidebar
2. Fill in **Basic Information**:
   - Title: `Test Class - UI Design Basics`
   - Subtitle: `Learn UI design from scratch`
   - Category: Select (e.g., "Design & Creativity")
   - Sub Category: Type custom (e.g., "UI/UX Design")
   - Description: Detailed description
   - What Students Will Learn: Bullet points
   - Level: Select (Beginner/Intermediate/Advanced)

3. **Media Section**:
   - ✅ Upload Thumbnail: Click file input, select image (JPEG/PNG/WebP/GIF, max 5MB)
   - ✅ Should show preview
   - ✅ Should upload to `public/uploads/classes/CLASS_ID/thumbnail_timestamp.jpg`
   - ✅ URL should be accessible at `http://localhost:3000/uploads/...`
   - Intro Video Link: (optional) YouTube URL

4. **Pricing & Capacity**:
   - Price: `999` (INR)
   - Max Seats: `30` (optional)

5. **Schedule Type**: Choose one

   **Option A: One-Time Class**
   - Select "One-Time"
   - Date: Tomorrow's date
   - Start Time: `14:00` (2 PM)
   - End Time: `16:00` (4 PM)

   **Option B: Recurring Batch**
   - Select "Recurring"
   - Start Date: Tomorrow
   - End Date: 2 weeks from now
   - Days: Select `Monday`, `Wednesday`, `Friday`
   - Start Time: `14:00`
   - End Time: `16:00`

6. Click **"Submit Class"**
7. ✅ Should show "Class submitted successfully! Waiting for admin approval."
8. ✅ Form resets
9. ✅ Class appears in "Manage Classes" with status "Pending"

### Step 4: Manage Classes
1. Click **"Manage Classes"** in sidebar
2. Should see:
   - ✅ All classes (pending and approved)
   - ✅ Status badges (Pending/Approved/Rejected)
   - ✅ Thumbnail preview
   - ✅ Price, title
   - ✅ "Edit Class" button (disabled for approved)
   - ✅ "View Class" button
   - ✅ "View Enrollments" button

3. Click **"View Class"** on a class:
   - ✅ Shows class details
   - ✅ Sessions list
   - ✅ Enrollments list
   - ✅ Analytics (enrollments, revenue, ratings)
   - ✅ "Start Class" button (for live sessions)

4. Click **"Edit Class"** on a pending class:
   - ✅ Opens edit form
   - ✅ Can update title, description, price
   - ✅ Can upload new thumbnail
   - ✅ Can update max seats
   - ✅ Save changes

### Step 5: View Analytics
1. Click **"Analytics"** in sidebar
2. Should show:
   - ✅ Total classes (approved, pending)
   - ✅ Total enrollments
   - ✅ Total revenue
   - ✅ Average rating
   - ✅ Enrollments per class breakdown
   - ✅ Attendance stats

### Step 6: View Enrollments
1. Click **"Enrollments"** in sidebar
2. Should show:
   - ✅ List of all enrollments across classes
   - ✅ Student name, email
   - ✅ Class name, price
   - ✅ Enrollment date
   - ✅ Attendance status
   - ✅ Ratings/feedback

### Step 7: Start Live Class
1. Go to **"Manage Classes"** → Click **"View Class"** on an approved class
2. Find a session that's scheduled for now or soon
3. Click **"Start Class"** button
4. ✅ Opens Live Class interface
5. ✅ Shows enrolled students list
6. ✅ Shows Google Meet iframe
7. ✅ Can see who's attending
8. ✅ "End Class" button available

### Step 8: End Class & Upload Recording
1. After class ends, click **"End Class"**
2. ✅ Session marked as completed
3. ✅ Can upload recording file
4. ✅ Recording saved to `public/uploads/recordings/CLASS_ID/BATCH_ID/recording_timestamp.mp4`
5. ✅ Notification sent to students about recording availability

### Step 9: Creator Profile
1. Click **"Profile"** in sidebar
2. Should show:
   - ✅ Current profile information
   - ✅ Can edit bio, expertise
   - ✅ Can update profile image
   - ✅ Can update social handles
   - ✅ Can update intro video

---

## 👨‍💼 TESTING FLOW 3: ADMIN JOURNEY

### Step 1: Login as Admin
1. Go to `/signup-login`
2. **Login** with:
   - Email: `kartik@zefrix.com`
   - Password: (your admin password)
3. ✅ Should redirect to `/admin-dashboard`
4. ✅ Role automatically set to `admin`

### Step 2: Admin Dashboard Overview
1. **Dashboard** should show:
   - ✅ Stats cards:
     - Total Enrollments
     - Total Creators
     - Active Classes
     - Total Students
     - Total Revenue
     - Pending Classes
   - ✅ Quick actions

2. **Sidebar Navigation**:
   - ✅ Dashboard
   - ✅ Creators
   - ✅ Approve Classes
   - ✅ Contact Messages
   - ✅ Payouts
   - ✅ Enrollments
   - ✅ Notifications

### Step 3: Approve Classes
1. Click **"Approve Classes"** in sidebar
2. Should see:
   - ✅ List of pending classes
   - ✅ Class details (title, creator, category, price, schedule)
   - ✅ Thumbnail preview
   - ✅ "View Details" button
   - ✅ "Approve" button
   - ✅ "Reject" button

3. Click **"View Details"**:
   - ✅ Shows full class information
   - ✅ Shows sessions schedule
   - ✅ Shows creator bank details (if available)

4. Click **"Approve"**:
   - ✅ Class status changes to "approved"
   - ✅ Email sent to creator (check console)
   - ✅ Notification created for creator
   - ✅ Class becomes visible to students

5. Click **"Reject"**:
   - ✅ Class status changes to "rejected"
   - ✅ Email sent to creator with rejection reason
   - ✅ Notification created for creator

### Step 4: Manage Creators
1. Click **"Creators"** in sidebar
2. Should show:
   - ✅ List of all creators
   - ✅ Creator name, email
   - ✅ Total classes, approved classes, pending classes
   - ✅ Total enrollments, earnings
   - ✅ "View Details" button

3. Click **"View Details"**:
   - ✅ Shows creator profile
   - ✅ Shows all classes
   - ✅ Shows earnings breakdown

### Step 5: Process Payouts
1. Click **"Payouts"** in sidebar
2. Should show:
   - ✅ List of creators with pending earnings
   - ✅ Creator name, email
   - ✅ Total earnings amount
   - ✅ Number of classes, enrollments
   - ✅ Bank details (account number, IFSC, bank name, UPI)
   - ✅ Status (Pending/Paid)
   - ✅ "View Details" button
   - ✅ "Mark as Paid" button

3. Click **"View Details"**:
   - ✅ Shows all bank details in a modal
   - ✅ Shows breakdown of earnings

4. Click **"Mark as Paid"**:
   - ✅ Confirmation dialog appears
   - ✅ Confirm
   - ✅ Payout record created in Firestore
   - ✅ Status changes to "Paid"
   - ✅ Notification sent to creator
   - ✅ Payout removed from "Total Pending" calculation

### Step 6: View Enrollments
1. Click **"Enrollments"** in sidebar
2. Should show:
   - ✅ All enrollments across all classes
   - ✅ Student name, email
   - ✅ Class name, creator
   - ✅ Price paid
   - ✅ Enrollment date
   - ✅ Payment status

### Step 7: View Contact Messages
1. Click **"Contact Messages"** in sidebar
2. Should show:
   - ✅ All contact form submissions
   - ✅ Name, email, subject, message
   - ✅ Timestamp
   - ✅ Can reply via email link

### Step 8: Admin Notifications
1. Click **"Notifications"** in sidebar
2. Should show:
   - ✅ All notifications (admin can see all)
   - ✅ Filter by unread/all
   - ✅ Mark as read
   - ✅ Delete notifications

---

## 🔔 TESTING FLOW 4: AUTOMATIONS & NOTIFICATIONS

### Step 1: Test Email Notifications

**A. Enrollment Confirmation Email**
1. Student enrolls in a class (via payment)
2. ✅ Check console logs for email sent
3. ✅ Email should contain:
   - Class details
   - Schedule information
   - Google Meet link
   - Session dates

**B. Class Approval Email**
1. Admin approves a class
2. ✅ Creator receives email
3. ✅ Email contains class details and approval message

**C. Class Rejection Email**
1. Admin rejects a class
2. ✅ Creator receives email
3. ✅ Email contains rejection reason

**D. Session Reminder Email**
1. Create a class with session scheduled for 24 hours from now
2. Wait OR use test endpoint: `GET http://localhost:3000/api/cron/send-session-reminders-test`
3. ✅ Students receive reminder email 24h before session
4. ✅ Email contains session details and Meet link

### Step 2: Test In-App Notifications

**A. Student Notifications**
1. Student enrolls in class
2. ✅ Notification appears in Student Dashboard → Notifications
3. ✅ Badge count updates
4. ✅ Can mark as read
5. ✅ Can delete

**B. Creator Notifications**
1. Creator's class gets approved
2. ✅ Notification appears in Creator Dashboard → Notifications
3. ✅ Badge count updates
4. ✅ Can click to view class

**C. Admin Notifications**
1. New class submitted
2. ✅ Notification appears in Admin Dashboard → Notifications
3. ✅ Can click to approve/reject

### Step 3: Test Session Reminders (Cron Job)

**Option A: Test Endpoint (Immediate)**
```bash
# In browser or Postman
GET http://localhost:3000/api/cron/send-session-reminders-test
```

This finds sessions scheduled between **10 minutes to 3 hours** from now.

**Steps:**
1. Create a class with a session scheduled for 1 hour from now
2. Enroll a student
3. Call the test endpoint
4. ✅ Student should receive reminder email
5. ✅ Notification created for student

**Option B: Production Cron (24h before)**
1. Create a class with session 25 hours from now
2. Enroll a student
3. Wait for cron job to run (or call `/api/cron/send-session-reminders`)
4. ✅ Student receives email 24h before session

---

## 🧪 TESTING FLOW 5: EDGE CASES & VALIDATION

### Test 1: File Upload Validation
1. Try uploading file > 5MB
   - ✅ Should show error: "Image size exceeds 5MB limit"

2. Try uploading non-image file
   - ✅ Should show error: "Invalid image type"

3. Upload valid image
   - ✅ Should upload successfully
   - ✅ Preview should show
   - ✅ URL should be accessible

### Test 2: Payment Edge Cases
1. **Payment Success but Enrollment Fails**:
   - ✅ Should show error message
   - ✅ Payment ID saved
   - ✅ Failed enrollment logged
   - ✅ Admin can manually enroll

2. **Partial Success** (multiple classes, some fail):
   - ✅ Should show partial success message
   - ✅ Successful enrollments created
   - ✅ Failed ones logged

### Test 3: Authentication Edge Cases
1. **Unauthenticated Access**:
   - Try accessing `/creator-dashboard` without login
   - ✅ Should redirect to `/signup-login`

2. **Wrong Role Access**:
   - Login as student, try accessing `/admin-dashboard`
   - ✅ Should redirect to `/student-dashboard`

3. **Google Auth**:
   - Click "Sign in with Google"
   - ✅ Should open Google popup
   - ✅ Should create account/login
   - ✅ Should redirect to appropriate dashboard

### Test 4: Class Management Edge Cases
1. **Edit Approved Class**:
   - Try editing an approved class
   - ✅ "Edit" button should be disabled
   - ✅ Tooltip shows "Cannot edit approved classes"

2. **Delete Class with Enrollments**:
   - Try deleting a class that has enrollments
   - ✅ Should show warning or prevent deletion

3. **Create Class Without Required Fields**:
   - Try submitting empty form
   - ✅ Should show validation errors

### Test 5: Batch Functionality
1. **Recurring Batch Creation**:
   - Create class with recurring schedule
   - ✅ Sessions should be auto-generated
   - ✅ All sessions should appear in "View Class"
   - ✅ Each session has unique Meet link

2. **Session Reminders for Batch**:
   - Enroll in a batch
   - ✅ Should receive reminder for each session
   - ✅ Each reminder has correct session number

---

## 📊 TESTING CHECKLIST

### ✅ Landing Page
- [ ] Hero section displays
- [ ] Categories section works
- [ ] Featured classes show
- [ ] Navigation links work
- [ ] CTA buttons functional

### ✅ Authentication
- [ ] Sign up works (student)
- [ ] Sign up works (creator via become-a-creator)
- [ ] Login works
- [ ] Google auth works
- [ ] Role assignment correct (admin/creator/student)
- [ ] Redirects work based on role

### ✅ Student Flow
- [ ] Browse classes
- [ ] Search classes
- [ ] Filter by category
- [ ] View class details
- [ ] Add to cart
- [ ] Checkout
- [ ] Payment (Razorpay test)
- [ ] Thank you page
- [ ] Enrollment confirmation email
- [ ] In-app notification
- [ ] View enrollments
- [ ] See upcoming sessions
- [ ] Join live class
- [ ] Rate & review

### ✅ Creator Flow
- [ ] Become a creator form
- [ ] Creator dashboard loads
- [ ] Create class form
- [ ] Upload thumbnail (file upload works)
- [ ] One-time class creation
- [ ] Recurring batch creation
- [ ] Class submission
- [ ] Manage classes
- [ ] Edit class (pending only)
- [ ] View class details
- [ ] View enrollments
- [ ] View analytics
- [ ] Start live class
- [ ] End class
- [ ] Upload recording
- [ ] Update profile

### ✅ Admin Flow
- [ ] Admin login
- [ ] Dashboard stats load
- [ ] View pending classes
- [ ] Approve class
- [ ] Reject class
- [ ] Email sent to creator
- [ ] View creators
- [ ] View payouts
- [ ] View bank details
- [ ] Mark payout as paid
- [ ] View enrollments
- [ ] View contact messages
- [ ] View notifications

### ✅ Automations
- [ ] Enrollment confirmation email
- [ ] Class approval email
- [ ] Class rejection email
- [ ] Session reminder email (24h)
- [ ] Session reminder notification
- [ ] New class notification (admin)
- [ ] Payment received notification (creator)

### ✅ File Uploads
- [ ] Thumbnail upload (CreateClassForm)
- [ ] Thumbnail upload (EditClassForm)
- [ ] Profile image upload
- [ ] Recording upload
- [ ] File validation (size, type)
- [ ] Files accessible via URL (localhost)
- [ ] Files saved to correct directory

### ✅ Notifications System
- [ ] Notifications appear in all dashboards
- [ ] Badge count updates
- [ ] Mark as read works
- [ ] Delete notification works
- [ ] Filter (all/unread) works
- [ ] Real-time updates work
- [ ] Notifications consistent with emails

---

## 🐛 COMMON ISSUES & SOLUTIONS

### Issue 1: Firebase Not Initialized
**Symptom**: "Firebase not ready" errors
**Solution**: 
- Wait a few seconds for Firebase to load
- Check browser console for Firebase initialization logs
- Refresh page

### Issue 2: File Upload Not Working
**Symptom**: Upload fails or URL not accessible
**Solution**:
- Check `public/uploads` directory exists
- Check file size < 5MB
- Check file type is image (JPEG/PNG/WebP/GIF)
- Check browser console for errors
- Verify URL: `http://localhost:3000/uploads/...`

### Issue 3: Payment Not Processing
**Symptom**: Razorpay modal doesn't open
**Solution**:
- Check Razorpay script loaded (check console)
- Verify test keys are configured
- Try refreshing page
- Check network tab for API calls

### Issue 4: Notifications Not Showing
**Symptom**: No notifications appear
**Solution**:
- Check Firestore `notifications` collection
- Verify user ID matches
- Check Firestore security rules
- Refresh page

### Issue 5: Session Reminders Not Sending
**Symptom**: No reminder emails
**Solution**:
- Use test endpoint: `/api/cron/send-session-reminders-test`
- Check session is within time window (10 min - 3 hours)
- Verify student is enrolled
- Check console logs for errors
- Verify email service (Resend) is configured

---

## 🎯 QUICK TEST SCENARIOS

### Scenario 1: Complete Student Journey (5 minutes)
1. Sign up as student
2. Browse classes
3. Enroll in one class
4. Complete payment
5. Check email notification
6. Check in-app notification
7. View enrollment in dashboard

### Scenario 2: Complete Creator Journey (10 minutes)
1. Become a creator
2. Create a class (one-time, tomorrow 2 PM)
3. Upload thumbnail
4. Submit for approval
5. Login as admin
6. Approve class
7. Login back as creator
8. Check approval notification
9. View class in dashboard

### Scenario 3: Complete Admin Journey (5 minutes)
1. Login as admin
2. View pending classes
3. Approve one class
4. View payouts
5. Mark a payout as paid
6. View enrollments
7. Check notifications

### Scenario 4: Test File Upload (2 minutes)
1. Login as creator
2. Create class
3. Upload thumbnail image
4. Verify preview shows
5. Submit class
6. Check file exists in `public/uploads/classes/...`
7. Verify URL works: `http://localhost:3000/uploads/...`

### Scenario 5: Test Notifications (3 minutes)
1. As student, enroll in class
2. Check notifications badge
3. Open notifications
4. Verify enrollment notification
5. Mark as read
6. Badge count decreases

---

## 📝 NOTES

- **Localhost URLs**: All file uploads use `http://localhost:3000/uploads/...`
- **Production URLs**: Will automatically use your domain (e.g., `https://zefrix.com/uploads/...`)
- **Email Testing**: Check console logs for email sending (Resend API)
- **Firestore**: Use Firebase Console to verify data
- **Cron Jobs**: Use test endpoint for immediate testing, production cron runs on schedule

---

## ✅ SUCCESS CRITERIA

Your app is working correctly if:
- ✅ Students can browse, enroll, and pay for classes
- ✅ Creators can create and manage classes
- ✅ Admin can approve classes and manage payouts
- ✅ File uploads work (thumbnails, profile images)
- ✅ Notifications appear in all dashboards
- ✅ Emails are sent for key events
- ✅ Session reminders work
- ✅ Live classes can be started/ended
- ✅ Ratings and reviews work
- ✅ All three dashboards load quickly (< 5 seconds)

---

**Happy Testing! 🚀**

