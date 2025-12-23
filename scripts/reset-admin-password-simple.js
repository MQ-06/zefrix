/**
 * Simple script to reset admin password
 * This version uses Firebase REST API (no Admin SDK needed)
 * 
 * Usage: node scripts/reset-admin-password-simple.js
 * 
 * IMPORTANT: You need to get an ID token first by logging in, or use Firebase Console
 * 
 * For production, use Firebase Console:
 * 1. Go to https://console.firebase.google.com
 * 2. Select your project: zefrix-custom
 * 3. Go to Authentication > Users
 * 4. Find kartik@zefrix.com
 * 5. Click the three dots > Reset password
 * 6. Enter new password: 9549908192Kg@26-11-04
 */

console.log('=====================================');
console.log('ADMIN PASSWORD RESET INSTRUCTIONS');
console.log('=====================================');
console.log('');
console.log('Email: kartik@zefrix.com');
console.log('New Password: 9549908192Kg@26-11-04');
console.log('');
console.log('OPTION 1 - Firebase Console (Recommended):');
console.log('1. Go to: https://console.firebase.google.com');
console.log('2. Select project: zefrix-custom');
console.log('3. Navigate to: Authentication > Users');
console.log('4. Find user: kartik@zefrix.com');
console.log('5. Click three dots (⋮) > Reset password');
console.log('6. Enter new password: 9549908192Kg@26-11-04');
console.log('');
console.log('OPTION 2 - Use Firebase Admin SDK Script:');
console.log('1. Install firebase-admin: npm install firebase-admin');
console.log('2. Get service account key from Firebase Console');
console.log('3. Set GOOGLE_APPLICATION_CREDENTIALS env var');
console.log('4. Run: node scripts/reset-admin-password.js');
console.log('');
console.log('OPTION 3 - Login and use "Forgot Password":');
console.log('1. Go to your app login page');
console.log('2. Click "Forgot Password"');
console.log('3. Enter: kartik@zefrix.com');
console.log('4. Check email and reset password');
console.log('5. Set new password: 9549908192Kg@26-11-04');
console.log('');

