# Email Delivery Documentation (Codebase Audit)

Date: March 26, 2026

## 1) Executive Summary

This project sends transactional emails through Resend.

Current central sender configuration is in lib/email.ts:
- Provider: Resend
- Sender address source: environment variable FROM_EMAIL
- Sender fallback if FROM_EMAIL is missing: notifications@zefrixapp.com
- Admin recipient source for class submission emails: environment variable ADMIN_EMAIL
- Admin recipient fallback if ADMIN_EMAIL is missing: admin@zefrix.com

Important implication:
If FROM_EMAIL points to a domain that is not verified in Resend, delivery can fail.

## 2) Email Provider and Domain Configuration

Primary provider and initialization:
- File: lib/email.ts
- Resend client is created only when RESEND_API_KEY exists.
- If RESEND_API_KEY is missing, all email functions log a warning and skip sending.

Sender domain/address behavior:
- Effective from address is FROM_EMAIL.
- If unset, from address defaults to notifications@zefrixapp.com.
- This means the practical sending domain is whichever domain is in FROM_EMAIL, otherwise zefrixapp.com via notifications@zefrixapp.com.

## 3) All Email Types, Trigger Paths, and Recipients

### A) Enrollment confirmation email

Function:
- sendEnrollmentConfirmationEmail in lib/email.ts

Trigger path:
- Checkout flow calls /api/payments/verify
- app/api/payments/verify/route.ts verifies payment, then calls sendEnrollmentConfirmationEmail for each item in cart

From:
- FROM_EMAIL (fallback notifications@zefrixapp.com)

To:
- studentEmail

Subject:
- Enrollment Confirmed: {className}

Additional behavior:
- Also writes in-app notification to notifications collection for the student.


### B) Class approval/rejection email to creator

Function:
- sendClassApprovalEmail in lib/email.ts

Trigger path:
- Admin dashboard class action calls /api/email/class-approval
- app/api/email/class-approval/route.ts calls sendClassApprovalEmail

From:
- FROM_EMAIL (fallback notifications@zefrixapp.com)

To:
- creatorEmail

Subject:
- Approved: Batch Approved: {className}
- Rejected: Batch Review: {className}

Additional behavior:
- Also writes in-app notifications (creator + admin + live fanout logic handled around this flow).


### C) New class submitted email to admin

Function:
- sendClassCreatedEmail in lib/email.ts

Trigger path:
- Creator batch creation frontend calls /api/email/class-created
- components/CreatorDashboard/CreateClassForm.tsx sends request
- app/api/email/class-created/route.ts calls sendClassCreatedEmail

From:
- FROM_EMAIL (fallback notifications@zefrixapp.com)

To:
- ADMIN_EMAIL (fallback admin@zefrix.com)

Subject:
- New Batch Pending Review: {className}

Additional behavior:
- Also writes in-app admin notifications and creator acknowledgement notification.


### D) Session reminder email to student

Function:
- sendSessionReminderEmail in lib/email.ts

Trigger path (production):
- app/api/cron/send-session-reminders/route.ts
- Cron route queries upcoming sessions and active enrollments
- For each eligible enrollment, sends sendSessionReminderEmail

Trigger path (test endpoint):
- app/api/cron/send-session-reminders-test/route.ts
- Same concept, smaller test window

From:
- FROM_EMAIL (fallback notifications@zefrixapp.com)

To:
- studentEmail

Subject:
- Reminder: {className} - {sessionDate}

Additional behavior:
- Also writes in-app reminder notification for student.

## 4) How Sending Actually Happens

All sending uses:
- resend.emails.send

Email body format:
- HTML templates generated inline inside lib/email.ts.

Base URL in email links:
- Uses NEXT_PUBLIC_BASE_URL if set
- Falls back to https://zefrix.com when NEXT_PUBLIC_BASE_URL is missing

## 5) Environment Variables That Control Email Behavior

Required/important:
- RESEND_API_KEY
  - If missing, email functions skip sending.

- FROM_EMAIL
  - Controls sender address/domain.
  - If missing, notifications@zefrixapp.com is used.

- ADMIN_EMAIL
  - Recipient for class submission admin email.
  - If missing, admin@zefrix.com is used.

- NEXT_PUBLIC_BASE_URL
  - Controls dashboard links included in email templates.
  - If missing, links default to https://zefrix.com.

Cron security (session reminder route):
- CRON_API_KEY
  - If set, production cron route requires matching x-api-key header.

## 6) Security and Operational Notes

1. Production cron route is conditionally protected
- app/api/cron/send-session-reminders/route.ts checks x-api-key only if CRON_API_KEY exists.
- If CRON_API_KEY is not set, route is effectively open.

2. Test cron route currently has no API-key protection
- app/api/cron/send-session-reminders-test/route.ts does not enforce key auth in current code.

3. Email API routes are currently not auth-gated in route handlers
- /api/email/class-created and /api/email/class-approval do not verify user token in route code.
- They rely on caller context and frontend usage patterns.

4. Payment verify sends enrollment emails in non-blocking mode
- /api/payments/verify starts Promise.all for email sends but does not await completion before returning success.
- This is intentional for payment latency, but can hide delayed email errors from immediate client response.

## 7) Complete File Map for Email Flow

Core sender logic:
- lib/email.ts

Route triggers:
- app/api/payments/verify/route.ts
- app/api/email/class-approval/route.ts
- app/api/email/class-created/route.ts
- app/api/cron/send-session-reminders/route.ts
- app/api/cron/send-session-reminders-test/route.ts

Frontend/API invocations:
- components/CreatorDashboard/CreateClassForm.tsx -> /api/email/class-created
- app/admin-dashboard/page.tsx -> /api/email/class-approval
- app/checkout/page.tsx -> /api/payments/verify

## 8) Practical Answer to "Which domain is sending emails?"

Current sending domain is determined by FROM_EMAIL.
- If FROM_EMAIL is set, its domain is used.
- If FROM_EMAIL is not set, sender becomes notifications@zefrixapp.com, so domain is zefrixapp.com.

So in your current code defaults, sender is from zefrix.com unless overridden in environment settings.
