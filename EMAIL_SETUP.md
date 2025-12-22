# Email Notifications Setup

This project uses **Resend** for sending email notifications. All email functionality is handled directly in the codebase.

## Environment Variables

Add the following to your `.env.local` file:

```env
# Resend API Key (get from https://resend.com/api-keys)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Email Configuration
FROM_EMAIL=noreply@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com

# Base URL (for email links)
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

## Setup Steps

1. **Sign up for Resend**
   - Go to https://resend.com
   - Create an account
   - Verify your domain (or use their test domain for development)

2. **Get API Key**
   - Go to API Keys section in Resend dashboard
   - Create a new API key
   - Copy the key (starts with `re_`)
   - Add to `.env.local` as `RESEND_API_KEY`

3. **Configure From Email**
   - Add your verified domain email to `FROM_EMAIL`
   - For testing, you can use `onboarding@resend.dev` (Resend's test domain)
   - Add admin email to `ADMIN_EMAIL`

4. **Update Base URL**
   - Set `NEXT_PUBLIC_BASE_URL` to your production domain
   - For local development: `http://localhost:3000`

## Email Templates

The following email notifications are implemented:

### 1. Enrollment Confirmation (to Student)
- **Trigger**: After successful payment verification
- **Location**: `app/api/payments/verify/route.ts`
- **Template**: `lib/email.ts` → `sendEnrollmentConfirmationEmail`

### 2. Class Approval (to Creator)
- **Trigger**: When admin approves a class
- **Location**: `app/admin-dashboard/page.tsx` → `handleClassAction`
- **Template**: `lib/email.ts` → `sendClassApprovalEmail`

### 3. Class Rejection (to Creator)
- **Trigger**: When admin rejects a class
- **Location**: `app/admin-dashboard/page.tsx` → `handleClassAction`
- **Template**: `lib/email.ts` → `sendClassApprovalEmail`

### 4. Class Created (to Admin)
- **Trigger**: When creator submits a new class
- **Location**: `components/CreatorDashboard/CreateClassForm.tsx`
- **Template**: `lib/email.ts` → `sendClassCreatedEmail`

### 5. Session Reminder (to Student)
- **Available**: `lib/email.ts` → `sendSessionReminderEmail`
- **Note**: Not yet integrated (can be added to session scheduling)

## Testing

1. **Development Testing**
   - Use Resend's test domain: `onboarding@resend.dev`
   - Check Resend dashboard for sent emails
   - Emails sent to test domain won't actually deliver

2. **Production Testing**
   - Verify your domain in Resend
   - Use your verified email addresses
   - Test each notification flow

## Resend Free Tier

- 3,000 emails/month
- 100 emails/day
- Perfect for MVP/development

## Troubleshooting

1. **Emails not sending**
   - Check API key is correct
   - Verify domain is verified (if not using test domain)
   - Check Resend dashboard for error logs

2. **API key errors**
   - Ensure key starts with `re_`
   - Check key hasn't expired
   - Verify key has correct permissions

3. **Domain verification**
   - Add DNS records as instructed by Resend
   - Wait for DNS propagation (can take up to 48 hours)
   - Use test domain for immediate testing

