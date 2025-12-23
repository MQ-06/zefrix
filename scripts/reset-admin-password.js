/**
 * Script to reset admin password using Firebase Admin SDK
 * Run: node scripts/reset-admin-password.js
 * 
 * Note: Requires FIREBASE_ADMIN_SDK_KEY environment variable
 * Or Firebase service account JSON file
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
// Option 1: Using service account JSON file
// const serviceAccount = require('../path/to/serviceAccountKey.json');
// admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

// Option 2: Using environment variable with service account JSON string
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_ADMIN_SDK_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else {
      // Try default Firebase initialization (uses GOOGLE_APPLICATION_CREDENTIALS env var)
      admin.initializeApp();
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    console.log('\nPlease set up Firebase Admin SDK:');
    console.log('1. Download service account key from Firebase Console');
    console.log('2. Set GOOGLE_APPLICATION_CREDENTIALS env var to point to the JSON file');
    console.log('   OR set FIREBASE_ADMIN_SDK_KEY env var with the JSON content');
    process.exit(1);
  }
}

const ADMIN_EMAIL = 'kartik@zefrix.com';
const NEW_PASSWORD = '9549908192Kg@26-11-04';

async function resetAdminPassword() {
  try {
    console.log(`Resetting password for admin: ${ADMIN_EMAIL}`);
    
    // Get user by email
    const userRecord = await admin.auth().getUserByEmail(ADMIN_EMAIL);
    console.log(`Found user: ${userRecord.uid}`);
    
    // Update password
    await admin.auth().updateUser(userRecord.uid, {
      password: NEW_PASSWORD
    });
    
    console.log('✅ Admin password updated successfully!');
    console.log(`Email: ${ADMIN_EMAIL}`);
    console.log(`New Password: ${NEW_PASSWORD}`);
    
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error(`❌ User with email ${ADMIN_EMAIL} not found.`);
      console.log('Creating admin user...');
      
      try {
        const userRecord = await admin.auth().createUser({
          email: ADMIN_EMAIL,
          password: NEW_PASSWORD,
          emailVerified: true
        });
        
        console.log('✅ Admin user created successfully!');
        console.log(`UID: ${userRecord.uid}`);
        console.log(`Email: ${ADMIN_EMAIL}`);
        console.log(`Password: ${NEW_PASSWORD}`);
      } catch (createError) {
        console.error('❌ Error creating admin user:', createError.message);
      }
    } else {
      console.error('❌ Error resetting password:', error.message);
    }
    process.exit(1);
  }
}

resetAdminPassword();

