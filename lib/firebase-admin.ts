/**
 * Firebase Admin SDK Initialization
 * Centralized initialization for server-side Firebase operations
 */
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';

// Firebase Storage bucket name
const STORAGE_BUCKET = process.env.FIREBASE_STORAGE_BUCKET || 'zefrix-custom.firebasestorage.app';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_ADMIN_SDK_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: STORAGE_BUCKET
      });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        storageBucket: STORAGE_BUCKET
      });
    } else {
      try {
        const serviceAccountPath = join(process.cwd(), 'firebase-service-account.json');
        const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          storageBucket: STORAGE_BUCKET
        });
      } catch (fileError) {
        admin.initializeApp({
          storageBucket: STORAGE_BUCKET
        });
      }
    }
  } catch (error: any) {
    console.error('❌ Firebase Admin initialization error:', error.message);
  }
}

export default admin;
export const db = admin.firestore();
export const storage = admin.storage();
export { STORAGE_BUCKET };

