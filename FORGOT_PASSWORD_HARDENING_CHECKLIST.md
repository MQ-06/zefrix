# Forgot Password Hardening Checklist

Date: March 27, 2026

## 1) Firebase Template and Action URL

Use these settings in Firebase Authentication templates for Password reset:

- Sender name: Zefrix Support
- From local part: notifications (after domain customization)
- Reply-to: support@zefrixapp.com
- Subject: Reset your Zefrix password
- Action URL: https://zefrixapp.com/reset-password

Required Firebase authorized domains:
- zefrixapp.com
- www.zefrixapp.com (if used)
- zefrix-custom.firebaseapp.com (keep for compatibility)

## 2) Required Reset Page Query Parameters

The reset page must safely handle:
- mode
- oobCode
- apiKey
- lang (optional)
- continueUrl (optional)

Behavior implemented:
- Rejects invalid mode or missing oobCode.
- Verifies reset code before rendering password form.
- Shows explicit messages for invalid or expired links.

## 3) Error Handling Implemented

Request reset step (signup-login page):
- invalid-email
- too-many-requests
- network-request-failed
- generic fallback
- user enumeration hardened with generic success messaging

Confirm reset step (reset page):
- weak-password
- expired-action-code
- invalid-action-code
- too-many-requests
- network-request-failed
- generic fallback

## 4) Security Checklist Implemented

- No logging of oobCode in client code.
- Reset page works without active login session.
- Reset link is verified before accepting a new password.
- New password must meet strong policy: at least 8 chars, uppercase, lowercase, number, special character, and no spaces.
- Confirm password must match.
- Submit button is disabled while request is in flight.
- HTTPS-only should be enforced in production at hosting level.
- Do not store reset codes in localStorage/sessionStorage.

## 5) Manual Test Cases

1. Valid link flow
- Request reset email
- Open fresh link
- Set valid password
- Confirm redirect to signup/login

2. Expired link
- Use an old link after expiry
- Expect: expired-link message and prompt to request new link

3. Reused link
- Use same link twice
- Expect: invalid/already used message

4. Missing oobCode
- Open /reset-password directly
- Expect: invalid link message

5. Wrong mode
- Open /reset-password?mode=verifyEmail
- Expect: invalid link message

6. Weak password
- Submit < 8 chars
- Expect: validation error

7. Password mismatch
- Submit non-matching values
- Expect: mismatch error

8. Rate limit behavior
- Trigger multiple reset requests quickly
- Expect: too-many-requests handling

9. Network failure behavior
- Simulate offline during verify/confirm
- Expect: network error guidance

10. Localization behavior
- Open link with lang parameter
- Ensure login redirect preserves lang when present

## 6) File Map of This Hardening

- app/reset-password/page.tsx
- contexts/AuthContext.tsx
- app/signup-login/page.tsx
