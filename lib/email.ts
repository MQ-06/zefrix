import { Resend } from 'resend';

// Initialize Resend only if API key exists (to avoid build errors)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@zefrix.com';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@zefrix.com';

interface EnrollmentEmailData {
  studentName: string;
  studentEmail: string;
  className: string;
  classId: string;
  paymentId: string;
  orderId: string;
  amount: number;
}

interface ClassApprovalEmailData {
  creatorName: string;
  creatorEmail: string;
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
  className: string;
  sessionDate: string;
  sessionTime: string;
  meetingLink: string;
}

// Enrollment Confirmation Email
export async function sendEnrollmentConfirmationEmail(data: EnrollmentEmailData) {
  if (!resend) {
    console.warn('Resend API key not configured. Skipping email send.');
    return;
  }

  try {
    const { studentName, studentEmail, className, paymentId, orderId, amount } = data;

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
            
            <p>You can now access your class details, session schedules, and join live sessions from your <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://zefrix.com'}/student-dashboard" style="color: #D92A63; text-decoration: none;">Student Dashboard</a>.</p>
            
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
    const { creatorName, creatorEmail, className, status, rejectionReason } = data;

    const html = status === 'approved' ? `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Class Approved</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">🎉 Your Class Has Been Approved!</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Dear ${creatorName},</p>
            
            <p>Great news! Your class <strong>${className}</strong> has been approved and is now live on Zefrix!</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
              <p>Students can now enroll in your class. Don't forget to:</p>
              <ul>
                <li>Fill in session details and bank account information</li>
                <li>Schedule your sessions</li>
                <li>Prepare your class materials</li>
              </ul>
            </div>
            
            <p><a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://zefrix.com'}/creator-dashboard" style="display: inline-block; background: #D92A63; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Manage Your Class</a></p>
            
            <p>Best of luck with your class!</p>
            
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
          <title>Class Rejected</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Class Review Update</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Dear ${creatorName},</p>
            
            <p>We regret to inform you that your class <strong>${className}</strong> could not be approved at this time.</p>
            
            ${rejectionReason ? `
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f44336;">
              <h3 style="margin-top: 0; color: #f44336;">Reason:</h3>
              <p>${rejectionReason}</p>
            </div>
            ` : ''}
            
            <p>Please review your class details and make the necessary changes. You can edit your class and resubmit it for approval.</p>
            
            <p><a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://zefrix.com'}/creator-dashboard" style="display: inline-block; background: #D92A63; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Edit Your Class</a></p>
            
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
      subject: status === 'approved' ? `Class Approved: ${className}` : `Class Review: ${className}`,
      html,
    });

    console.log(`✅ Class ${status} email sent to ${creatorEmail}`);
  } catch (error) {
    console.error(`Error sending class ${status} email:`, error);
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
          <title>New Class Created</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #D92A63 0%, #FF654B 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">New Class Pending Review</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>A new class has been created and is pending your review:</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #D92A63;">
              <h3 style="margin-top: 0; color: #D92A63;">Class Details</h3>
              <p><strong>Class Name:</strong> ${className}</p>
              <p><strong>Class ID:</strong> ${classId}</p>
              <p><strong>Creator:</strong> ${creatorName} (${creatorEmail})</p>
              <p><strong>Category:</strong> ${category}</p>
              <p><strong>Price:</strong> ₹${price.toFixed(2)}</p>
            </div>
            
            <p><a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://zefrix.com'}/admin-dashboard" style="display: inline-block; background: #D92A63; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Review Class</a></p>
          </div>
        </body>
      </html>
    `;

    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `New Class Pending Review: ${className}`,
      html,
    });

    console.log(`✅ Class creation notification sent to admin`);
  } catch (error) {
    console.error('Error sending class creation email:', error);
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
  } catch (error) {
    console.error('Error sending session reminder email:', error);
    throw error;
  }
}

