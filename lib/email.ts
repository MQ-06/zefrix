import { Resend } from 'resend';
import { shouldSendEmailForEvent } from '@/lib/emailPolicy';

// Initialize Resend only if API key exists (to avoid build errors)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = process.env.FROM_EMAIL || 'notifications@zefrixapp.com';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@zefrix.com';

function getAdminEmailRecipients(): string[] {
  const listFromEnv = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  const fallbackList = [ADMIN_EMAIL].filter(Boolean);
  const finalList = (listFromEnv.length > 0 ? listFromEnv : fallbackList).map((email) =>
    email.toLowerCase(),
  );

  return Array.from(new Set(finalList));
}

/**
 * Helper function to create notification (server-side only)
 * Uses Firebase Admin SDK directly
 */
async function createNotification(data: {
  userId: string;
  userRole: 'student' | 'creator' | 'admin';
  type: string;
  title: string;
  message: string;
  link?: string;
  relatedId?: string;
  metadata?: any;
}) {
  try {
    // Dynamically import Firebase Admin SDK (only works server-side)
    const admin = await import('firebase-admin');
    const { readFileSync } = await import('fs');
    const { join } = await import('path');

    // Initialize Firebase Admin if not already initialized
    if (!admin.default.apps.length) {
      try {
        if (process.env.FIREBASE_ADMIN_SDK_KEY) {
          const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_KEY);
          admin.default.initializeApp({
            credential: admin.default.credential.cert(serviceAccount)
          });
        } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
          admin.default.initializeApp({
            credential: admin.default.credential.applicationDefault()
          });
        } else {
          try {
            const serviceAccountPath = join(process.cwd(), 'firebase-service-account.json');
            const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
            admin.default.initializeApp({
              credential: admin.default.credential.cert(serviceAccount)
            });
          } catch (fileError) {
            admin.default.initializeApp();
          }
        }
      } catch (error: any) {
        console.error('❌ Firebase Admin initialization error in createNotification:', error.message);
        return; // Don't throw, just skip notification
      }
    }

    const db = admin.default.firestore();
    const notificationsRef = db.collection('notifications');
    
    await notificationsRef.add({
      ...data,
      isRead: false,
      createdAt: admin.default.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ Notification created for ${data.userRole} ${data.userId}: ${data.title}`);
  } catch (error: any) {
    console.error('Error creating notification:', error);
    // Don't throw - notification failure shouldn't block email sending
  }
}

interface EnrollmentEmailData {
  studentName: string;
  studentEmail: string;
  studentId?: string; // Optional: for creating notifications
  className: string;
  classId: string;
  paymentId: string;
  orderId: string;
  amount: number;
}

interface ClassApprovalEmailData {
  creatorName: string;
  creatorEmail: string;
  creatorId?: string; // Optional: for creating notifications
  className: string;
  classId: string;
  status: 'approved' | 'rejected';
  rejectionReason?: string;
}

interface ClassCreatedEmailData {
  creatorName: string;
  creatorEmail: string;
  className: string;
  classId: string;
  category: string;
  price: number;
}

interface SessionReminderEmailData {
  studentName: string;
  studentEmail: string;
  studentId?: string; // Optional: for creating notifications
  className: string;
  classId?: string; // Optional: for creating notifications
  sessionDate: string;
  sessionTime: string;
  meetingLink: string;
}

interface AdminContactMessageEmailData {
  name: string;
  email: string;
  subject: string;
  message?: string;
  phone?: string;
  messageId?: string;
}

interface AdminCreatorSignupEmailData {
  userId: string;
  userName: string;
  userEmail: string;
  source?: string;
}

interface CreatorPayoutReleasedEmailData {
  creatorName: string;
  creatorEmail: string;
  amount: number;
  classCount?: number;
  enrollmentCount?: number;
  releasedBy?: string;
}

// Enrollment Confirmation Email
export async function sendEnrollmentConfirmationEmail(data: EnrollmentEmailData) {
  if (!resend) {
    console.warn('Resend API key not configured. Skipping email send.');
    return;
  }

  try {
    const { studentName, studentEmail, studentId, className, classId, paymentId, orderId, amount } = data;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Enrollment Confirmation</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #D92A63 0%, #FF654B 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Welcome to ${className}!</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Dear ${studentName},</p>
            
            <p>Congratulations! Your enrollment in <strong>${className}</strong> has been confirmed.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #D92A63;">
              <h3 style="margin-top: 0; color: #D92A63;">Payment Details</h3>
              <p><strong>Payment ID:</strong> ${paymentId}</p>
              <p><strong>Order ID:</strong> ${orderId}</p>
              <p><strong>Amount Paid:</strong> ₹${amount.toFixed(2)}</p>
            </div>
            
            <p>You can now access your batch details, session schedules, and join live sessions from your <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://zefrix.com'}/student-dashboard" style="color: #D92A63; text-decoration: none;">Student Dashboard</a>.</p>
            
            <p>We'll send you reminders before each session so you don't miss anything!</p>
            
            <p>Happy Learning!</p>
            
            <p style="margin-top: 30px;">
              Best regards,<br>
              <strong>The Zefrix Team</strong>
            </p>
          </div>
        </body>
      </html>
    `;

    await resend.emails.send({
      from: FROM_EMAIL,
      to: studentEmail,
      subject: `Enrollment Confirmed: ${className}`,
      html,
    });

    console.log(`✅ Enrollment confirmation email sent to ${studentEmail}`);

    // Create notification if studentId is provided
    if (studentId) {
      console.log(`📝 Creating enrollment notification for student: ${studentId}, batch: ${className}`);
      try {
        await createNotification({
          userId: studentId,
          userRole: 'student',
          type: 'enrollment_confirmed',
          title: `Enrollment Confirmed: ${className}`,
          message: `You have successfully enrolled in "${className}". Check your dashboard for session details.`,
          link: `/student-dashboard?view=my-enrollments`,
          relatedId: classId,
          metadata: {
            className,
            classId,
            amount,
            paymentId,
            orderId,
          },
        });
        console.log(`✅ Enrollment notification created successfully for student: ${studentId}`);
      } catch (notifError) {
        console.error('❌ Error creating enrollment notification:', notifError);
        // Don't throw - notification failure shouldn't block email sending
      }
    } else {
      console.warn('⚠️ No studentId provided, skipping enrollment notification creation');
    }
  } catch (error) {
    console.error('Error sending enrollment confirmation email:', error);
    throw error;
  }
}

// Class Approval/Rejection Email
export async function sendClassApprovalEmail(data: ClassApprovalEmailData) {
  if (!resend) {
    console.warn('Resend API key not configured. Skipping email send.');
    return;
  }

  try {
    const { creatorName, creatorEmail, creatorId, className, classId, status, rejectionReason } = data;

    const html = status === 'approved' ? `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Batch Approved</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">🎉 Your Batch Has Been Approved!</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Dear ${creatorName},</p>
            
            <p>Great news! Your batch <strong>${className}</strong> has been approved and is now live on Zefrix!</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
              <p>Students can now enroll in your batch. Don't forget to:</p>
              <ul>
                <li>Fill in session details and bank account information</li>
                <li>Schedule your sessions</li>
                <li>Prepare your class materials</li>
              </ul>
            </div>
            
            <p><a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://zefrix.com'}/creator-dashboard" style="display: inline-block; background: #D92A63; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Manage Your Batch</a></p>
            
            <p>Best of luck with your batch!</p>
            
            <p style="margin-top: 30px;">
              Best regards,<br>
              <strong>The Zefrix Team</strong>
            </p>
          </div>
        </body>
      </html>
    ` : `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Batch Rejected</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Class Review Update</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Dear ${creatorName},</p>
            
            <p>We regret to inform you that your batch <strong>${className}</strong> could not be approved at this time.</p>
            
            ${rejectionReason ? `
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f44336;">
              <h3 style="margin-top: 0; color: #f44336;">Reason:</h3>
              <p>${rejectionReason}</p>
            </div>
            ` : ''}
            
            <p>Please review your batch details and make the necessary changes. You can edit your batch and resubmit it for approval.</p>
            
            <p><a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://zefrix.com'}/creator-dashboard" style="display: inline-block; background: #D92A63; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Edit Your Batch</a></p>
            
            <p>If you have any questions, please don't hesitate to contact our support team.</p>
            
            <p style="margin-top: 30px;">
              Best regards,<br>
              <strong>The Zefrix Team</strong>
            </p>
          </div>
        </body>
      </html>
    `;

    await resend.emails.send({
      from: FROM_EMAIL,
      to: creatorEmail,
      subject: status === 'approved' ? `Batch Approved: ${className}` : `Batch Review: ${className}`,
      html,
    });

    console.log(`✅ Batch ${status} email sent to ${creatorEmail}`);

    // Create notification if creatorId is provided
    if (creatorId) {
      console.log('🔔 Creating notification for creator:', creatorId, 'type:', status === 'approved' ? 'class_approved' : 'class_rejected');
      try {
        await createNotification({
          userId: creatorId,
          userRole: 'creator',
          type: status === 'approved' ? 'class_approved' : 'class_rejected',
          title: status === 'approved' ? `Batch Approved: ${className}` : `Batch Review: ${className}`,
          message: status === 'approved'
            ? `Your batch "${className}" has been approved and is now live!`
            : `Your batch "${className}" needs revision. Please check the details.`,
          link: `/creator-dashboard?classId=${classId}`,
          relatedId: classId,
          metadata: {
            className,
            classId,
            rejectionReason: status === 'rejected' ? rejectionReason : undefined,
          },
        });
        console.log('✅ Notification created successfully for creator:', creatorId);
      } catch (notifError) {
        console.error('❌ Error creating notification:', notifError);
        // Don't throw - notification failure shouldn't block email sending
      }
    } else {
      console.warn('⚠️ No creatorId provided, skipping notification creation');
    }
  } catch (error) {
    console.error(`Error sending batch ${status} email:`, error);
    throw error;
  }
}

// Class Creation Notification (to Admin)
export async function sendClassCreatedEmail(data: ClassCreatedEmailData) {
  if (!resend) {
    console.warn('Resend API key not configured. Skipping email send.');
    return;
  }

  try {
    const { creatorName, creatorEmail, className, classId, category, price } = data;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Batch Created</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #D92A63 0%, #FF654B 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">New Batch Pending Review</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>A new batch has been created and is pending your review:</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #D92A63;">
              <h3 style="margin-top: 0; color: #D92A63;">Class Details</h3>
              <p><strong>Batch Name:</strong> ${className}</p>
              <p><strong>Batch ID:</strong> ${classId}</p>
              <p><strong>Creator:</strong> ${creatorName} (${creatorEmail})</p>
              <p><strong>Category:</strong> ${category}</p>
              <p><strong>Price:</strong> ₹${price.toFixed(2)}</p>
            </div>
            
            <p><a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://zefrix.com'}/admin-dashboard" style="display: inline-block; background: #D92A63; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Review Batch</a></p>
          </div>
        </body>
      </html>
    `;

    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `New Batch Pending Review: ${className}`,
      html,
    });

    console.log(`✅ Batch creation notification sent to admin`);
    // Note: Admin notification is created in the API route (class-created/route.ts)
    // because we need Firebase Admin SDK to look up admin userId
  } catch (error) {
    console.error('Error sending batch creation email:', error);
    // Don't throw - this is a notification, shouldn't block class creation
  }
}

// Session Reminder Email
export async function sendSessionReminderEmail(data: SessionReminderEmailData) {
  if (!resend) {
    console.warn('Resend API key not configured. Skipping email send.');
    return;
  }

  try {
    const { studentName, studentEmail, className, sessionDate, sessionTime, meetingLink } = data;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Session Reminder</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #D92A63 0%, #FF654B 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">📅 Session Reminder</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Dear ${studentName},</p>
            
            <p>This is a reminder that you have a session coming up for <strong>${className}</strong>.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #D92A63;">
              <h3 style="margin-top: 0; color: #D92A63;">Session Details</h3>
              <p><strong>Date:</strong> ${sessionDate}</p>
              <p><strong>Time:</strong> ${sessionTime}</p>
            </div>
            
            <p><a href="${meetingLink}" style="display: inline-block; background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Join Session</a></p>
            
            <p>See you there!</p>
            
            <p style="margin-top: 30px;">
              Best regards,<br>
              <strong>The Zefrix Team</strong>
            </p>
          </div>
        </body>
      </html>
    `;

    await resend.emails.send({
      from: FROM_EMAIL,
      to: studentEmail,
      subject: `Reminder: ${className} - ${sessionDate}`,
      html,
    });

    console.log(`✅ Session reminder email sent to ${studentEmail}`);

    // Create notification if studentId is provided
    if (data.studentId) {
      const reminderType = data.sessionTime && data.sessionTime.includes('24') ? 'session_reminder_24h' : 'session_reminder_1h';
      await createNotification({
        userId: data.studentId,
        userRole: 'student',
        type: reminderType,
        title: `Session Reminder: ${data.className}`,
        message: `Reminder: Your session for "${data.className}" is ${reminderType.includes('24h') ? 'tomorrow' : 'in 1 hour'} at ${data.sessionTime}.`,
        link: '/student-dashboard?view=upcoming-sessions',
        relatedId: data.classId,
        metadata: {
          className: data.className,
          classId: data.classId,
          sessionDate: data.sessionDate,
          sessionTime: data.sessionTime,
          meetingLink: data.meetingLink,
        },
      });
    }
  } catch (error) {
    console.error('Error sending session reminder email:', error);
    throw error;
  }
}

export async function sendAdminContactMessageEmail(data: AdminContactMessageEmailData) {
  if (!shouldSendEmailForEvent('admin_contact_message')) {
    return;
  }

  if (!resend) {
    console.warn('Resend API key not configured. Skipping email send.');
    return;
  }

  const recipients = getAdminEmailRecipients();
  if (recipients.length === 0) {
    console.warn('No admin email recipients configured. Skipping admin contact-message email.');
    return;
  }

  const safeName = String(data.name || 'Unknown').trim();
  const safeEmail = String(data.email || '').trim().toLowerCase();
  const safeSubject = String(data.subject || 'No subject').trim();
  const safeMessage = String(data.message || '').trim();
  const safePhone = String(data.phone || '').trim();
  const safeMessageId = String(data.messageId || '').trim();
  const adminUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://zefrix.com'}/admin-dashboard?page=contact-messages`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Contact Message</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 640px; margin: 0 auto; padding: 20px;">
        <h2 style="margin-top: 0;">New Contact Message</h2>
        <p>A new contact request requires admin attention.</p>
        <div style="background: #f7f7f7; padding: 16px; border-radius: 8px;">
          <p><strong>Name:</strong> ${safeName}</p>
          <p><strong>Email:</strong> ${safeEmail || 'N/A'}</p>
          <p><strong>Phone:</strong> ${safePhone || 'N/A'}</p>
          <p><strong>Subject:</strong> ${safeSubject}</p>
          <p><strong>Message ID:</strong> ${safeMessageId || 'N/A'}</p>
          <p><strong>Message:</strong><br>${safeMessage || 'N/A'}</p>
        </div>
        <p style="margin-top: 20px;"><a href="${adminUrl}" style="color: #D92A63;">Open contact messages in admin dashboard</a></p>
      </body>
    </html>
  `;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: recipients,
    subject: `Admin Alert: New Contact Message - ${safeSubject}`,
    html,
  });
}

export async function sendAdminCreatorSignupEmail(data: AdminCreatorSignupEmailData) {
  if (!shouldSendEmailForEvent('admin_creator_signup')) {
    return;
  }

  if (!resend) {
    console.warn('Resend API key not configured. Skipping email send.');
    return;
  }

  const recipients = getAdminEmailRecipients();
  if (recipients.length === 0) {
    console.warn('No admin email recipients configured. Skipping admin creator-signup email.');
    return;
  }

  const safeName = String(data.userName || 'Creator').trim();
  const safeEmail = String(data.userEmail || '').trim().toLowerCase();
  const safeUserId = String(data.userId || '').trim();
  const safeSource = String(data.source || 'unknown').trim();
  const adminUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://zefrix.com'}/admin-dashboard?page=creators`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Creator Signup</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 640px; margin: 0 auto; padding: 20px;">
        <h2 style="margin-top: 0;">New Creator Signup</h2>
        <p>A new creator has signed up and may require review.</p>
        <div style="background: #f7f7f7; padding: 16px; border-radius: 8px;">
          <p><strong>Name:</strong> ${safeName}</p>
          <p><strong>Email:</strong> ${safeEmail || 'N/A'}</p>
          <p><strong>User ID:</strong> ${safeUserId || 'N/A'}</p>
          <p><strong>Source:</strong> ${safeSource}</p>
        </div>
        <p style="margin-top: 20px;"><a href="${adminUrl}" style="color: #D92A63;">Open creators in admin dashboard</a></p>
      </body>
    </html>
  `;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: recipients,
    subject: `Admin Alert: New Creator Signup - ${safeName}`,
    html,
  });
}

// ─── Session Live Now ───────────────────────────────────────────────────────

interface SessionLiveEmailData {
  studentName: string;
  studentEmail: string;
  studentId?: string;
  className: string;
  classId: string;
  sessionNumber: number;
  meetingLink: string;
}

export async function sendSessionLiveEmail(data: SessionLiveEmailData) {
  if (!resend) {
    console.warn('Resend not configured. Skipping session-live email.');
    return;
  }

  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://zefrix.com';
  const html = `
    <!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
    <body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;">
      <div style="background:linear-gradient(135deg,#D92A63 0%,#FF654B 100%);padding:30px;text-align:center;border-radius:10px 10px 0 0;">
        <h1 style="color:white;margin:0;">🔴 Class is Live Now!</h1>
      </div>
      <div style="background:#f9f9f9;padding:30px;border-radius:0 0 10px 10px;">
        <p>Hi ${data.studentName},</p>
        <p>Your class <strong>${data.className}</strong> — Session ${data.sessionNumber} has just started!</p>
        <div style="background:white;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #D92A63;">
          <p style="margin:0;"><strong>Session:</strong> ${data.className} — Session ${data.sessionNumber}</p>
          <p style="margin:8px 0 0;"><strong>Status:</strong> <span style="color:#D92A63;font-weight:bold;">LIVE NOW</span></p>
        </div>
        <div style="text-align:center;margin:24px 0;">
          <a href="${data.meetingLink}" style="background:linear-gradient(135deg,#D92A63 0%,#FF654B 100%);color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">Join Class Now →</a>
        </div>
        <p style="color:#888;font-size:13px;">If the button doesn't work, copy this link: <a href="${data.meetingLink}" style="color:#D92A63;">${data.meetingLink}</a></p>
        <p>Best regards,<br><strong>The Zefrix Team</strong></p>
      </div>
    </body></html>
  `;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: data.studentEmail,
    subject: `🔴 Live Now: ${data.className} — Session ${data.sessionNumber}`,
    html,
  });

  console.log(`✅ Session-live email sent to ${data.studentEmail}`);

  if (data.studentId) {
    try {
      await createNotification({
        userId: data.studentId,
        userRole: 'student',
        type: 'session_live',
        title: `Live Now: ${data.className}`,
        message: `Session ${data.sessionNumber} of "${data.className}" is live! Join now.`,
        link: `/student-dashboard`,
        relatedId: data.classId,
        metadata: { className: data.className, sessionNumber: data.sessionNumber, meetingLink: data.meetingLink },
      });
    } catch (e) {
      console.error('Notification error (non-blocking):', e);
    }
  }
}

// ─── New Enrollment Alert (to Creator) ──────────────────────────────────────

interface NewEnrollmentAlertEmailData {
  creatorName: string;
  creatorEmail: string;
  creatorId?: string;
  className: string;
  classId: string;
  studentName: string;
  studentEmail: string;
  totalEnrollments?: number;
}

export async function sendNewEnrollmentAlertEmail(data: NewEnrollmentAlertEmailData) {
  if (!resend) {
    console.warn('Resend not configured. Skipping new-enrollment-alert email.');
    return;
  }

  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://zefrix.com';
  const html = `
    <!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
    <body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;">
      <div style="background:linear-gradient(135deg,#D92A63 0%,#FF654B 100%);padding:30px;text-align:center;border-radius:10px 10px 0 0;">
        <h1 style="color:white;margin:0;">🎉 New Student Enrolled!</h1>
      </div>
      <div style="background:#f9f9f9;padding:30px;border-radius:0 0 10px 10px;">
        <p>Hi ${data.creatorName},</p>
        <p>Great news! A new student has enrolled in your batch.</p>
        <div style="background:white;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #D92A63;">
          <p style="margin:0;"><strong>Batch:</strong> ${data.className}</p>
          <p style="margin:8px 0 0;"><strong>Student:</strong> ${data.studentName}</p>
          <p style="margin:8px 0 0;"><strong>Student Email:</strong> ${data.studentEmail}</p>
          ${data.totalEnrollments ? `<p style="margin:8px 0 0;"><strong>Total Enrolled:</strong> ${data.totalEnrollments}</p>` : ''}
        </div>
        <div style="text-align:center;margin:24px 0;">
          <a href="${base}/creator-dashboard" style="background:linear-gradient(135deg,#D92A63 0%,#FF654B 100%);color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;">View Creator Dashboard →</a>
        </div>
        <p>Best regards,<br><strong>The Zefrix Team</strong></p>
      </div>
    </body></html>
  `;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: data.creatorEmail,
    subject: `New Enrollment: ${data.studentName} joined ${data.className}`,
    html,
  });

  console.log(`✅ New-enrollment-alert email sent to creator ${data.creatorEmail}`);
}

// ─── Recording Available ─────────────────────────────────────────────────────

interface RecordingAvailableEmailData {
  studentName: string;
  studentEmail: string;
  studentId?: string;
  className: string;
  classId: string;
  sessionNumber: number;
  recordingLink: string;
}

export async function sendRecordingAvailableEmail(data: RecordingAvailableEmailData) {
  if (!resend) {
    console.warn('Resend not configured. Skipping recording-available email.');
    return;
  }

  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://zefrix.com';
  const html = `
    <!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
    <body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;">
      <div style="background:linear-gradient(135deg,#D92A63 0%,#FF654B 100%);padding:30px;text-align:center;border-radius:10px 10px 0 0;">
        <h1 style="color:white;margin:0;">🎬 Recording Available!</h1>
      </div>
      <div style="background:#f9f9f9;padding:30px;border-radius:0 0 10px 10px;">
        <p>Hi ${data.studentName},</p>
        <p>The recording for <strong>${data.className}</strong> — Session ${data.sessionNumber} is now available. Watch it at your own pace!</p>
        <div style="background:white;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #D92A63;">
          <p style="margin:0;"><strong>Batch:</strong> ${data.className}</p>
          <p style="margin:8px 0 0;"><strong>Session:</strong> Session ${data.sessionNumber}</p>
        </div>
        <div style="text-align:center;margin:24px 0;">
          <a href="${data.recordingLink}" style="background:linear-gradient(135deg,#D92A63 0%,#FF654B 100%);color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">▶ Watch Recording</a>
        </div>
        <p style="color:#888;font-size:13px;">Or access it from your <a href="${base}/student-dashboard" style="color:#D92A63;">Student Dashboard</a>.</p>
        <p>Best regards,<br><strong>The Zefrix Team</strong></p>
      </div>
    </body></html>
  `;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: data.studentEmail,
    subject: `Recording Available: ${data.className} — Session ${data.sessionNumber}`,
    html,
  });

  console.log(`✅ Recording-available email sent to ${data.studentEmail}`);

  if (data.studentId) {
    try {
      await createNotification({
        userId: data.studentId,
        userRole: 'student',
        type: 'recording_available',
        title: `Recording Available: ${data.className}`,
        message: `Session ${data.sessionNumber} recording for "${data.className}" is ready to watch.`,
        link: `/student-dashboard`,
        relatedId: data.classId,
        metadata: { className: data.className, sessionNumber: data.sessionNumber, recordingLink: data.recordingLink },
      });
    } catch (e) {
      console.error('Notification error (non-blocking):', e);
    }
  }
}

// ─── Payout Released ─────────────────────────────────────────────────────────

export async function sendCreatorPayoutReleasedEmail(data: CreatorPayoutReleasedEmailData) {
  if (!shouldSendEmailForEvent('creator_payout_released')) {
    return;
  }

  if (!resend) {
    console.warn('Resend API key not configured. Skipping email send.');
    return;
  }

  const safeCreatorEmail = String(data.creatorEmail || '').trim().toLowerCase();
  if (!safeCreatorEmail) {
    console.warn('Creator email missing. Skipping payout release email.');
    return;
  }

  const safeCreatorName = String(data.creatorName || 'Creator').trim();
  const safeAmount = Number(data.amount || 0);
  const safeClassCount = Number(data.classCount || 0);
  const safeEnrollmentCount = Number(data.enrollmentCount || 0);
  const safeReleasedBy = String(data.releasedBy || 'Admin').trim();
  const creatorUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://zefrix.com'}/creator-dashboard`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payout Released</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 640px; margin: 0 auto; padding: 20px;">
        <h2 style="margin-top: 0;">Your Payout Has Been Released</h2>
        <p>Hello ${safeCreatorName},</p>
        <p>Your payout has been released by admin.</p>
        <div style="background: #f7f7f7; padding: 16px; border-radius: 8px;">
          <p><strong>Amount:</strong> INR ${safeAmount.toFixed(2)}</p>
          <p><strong>Classes included:</strong> ${safeClassCount}</p>
          <p><strong>Enrollments included:</strong> ${safeEnrollmentCount}</p>
          <p><strong>Released by:</strong> ${safeReleasedBy}</p>
        </div>
        <p style="margin-top: 20px;"><a href="${creatorUrl}" style="color: #D92A63;">Open creator dashboard</a></p>
      </body>
    </html>
  `;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: safeCreatorEmail,
    subject: `Payout Released: INR ${safeAmount.toFixed(2)}`,
    html,
  });
}

