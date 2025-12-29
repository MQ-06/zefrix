import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    // Option 1: Use service account from environment variable (JSON string)
    if (process.env.FIREBASE_ADMIN_SDK_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('✅ Firebase Admin initialized using FIREBASE_ADMIN_SDK_KEY');
    } 
    // Option 2: Use GOOGLE_APPLICATION_CREDENTIALS environment variable (path to JSON file)
    else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault()
      });
      console.log('✅ Firebase Admin initialized using GOOGLE_APPLICATION_CREDENTIALS');
    }
    // Option 3: Try to read firebase-service-account.json from project root
    else {
      try {
        const serviceAccountPath = join(process.cwd(), 'firebase-service-account.json');
        const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        console.log('✅ Firebase Admin initialized using firebase-service-account.json');
      } catch (fileError) {
        // Option 4: Try default initialization
        admin.initializeApp();
        console.log('✅ Firebase Admin initialized using default method');
      }
    }
  } catch (error: any) {
    console.error('❌ Firebase Admin initialization error:', error.message);
  }
}

const ADMIN_EMAIL = 'kartik@zefrix.com';
const NEW_PASSWORD = '9549908192Kg@26-11-04';

export async function POST(request: NextRequest) {
  try {
    // Optional: Add security check (API key, etc.)
    const body = await request.json();
    const { secretKey } = body;

    // Simple security check - you can enhance this
    if (secretKey !== process.env.ADMIN_PASSWORD_RESET_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log(`Resetting password for admin: ${ADMIN_EMAIL}`);

    // Get user by email
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(ADMIN_EMAIL);
      console.log(`Found user: ${userRecord.uid}`);

      // Update password
      await admin.auth().updateUser(userRecord.uid, {
        password: NEW_PASSWORD
      });

      console.log('✅ Admin password updated successfully!');
      
      return NextResponse.json({
        success: true,
        message: 'Admin password updated successfully',
        email: ADMIN_EMAIL,
      });

    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        console.log('User not found, creating admin user...');
        
        // Create admin user if it doesn't exist
        userRecord = await admin.auth().createUser({
          email: ADMIN_EMAIL,
          password: NEW_PASSWORD,
          emailVerified: true
        });

        console.log('✅ Admin user created successfully!');
        
        return NextResponse.json({
          success: true,
          message: 'Admin user created successfully',
          email: ADMIN_EMAIL,
          uid: userRecord.uid,
        });
      } else {
        throw error;
      }
    }

  } catch (error: any) {
    console.error('Error resetting admin password:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to reset password',
        hint: 'Make sure Firebase Admin SDK is properly configured with service account credentials'
      },
      { status: 500 }
    );
  }
}

// Also allow GET for easy testing (with secret key in query param)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const secretKey = searchParams.get('secret');

    if (secretKey !== process.env.ADMIN_PASSWORD_RESET_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Provide ?secret=YOUR_SECRET_KEY' },
        { status: 401 }
      );
    }

    console.log(`Resetting password for admin: ${ADMIN_EMAIL}`);

    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(ADMIN_EMAIL);
      await admin.auth().updateUser(userRecord.uid, {
        password: NEW_PASSWORD
      });
      console.log('✅ Admin password updated successfully!');
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        userRecord = await admin.auth().createUser({
          email: ADMIN_EMAIL,
          password: NEW_PASSWORD,
          emailVerified: true
        });
        console.log('✅ Admin user created successfully!');
      } else {
        throw error;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Admin password updated successfully',
      email: ADMIN_EMAIL,
    });

  } catch (error: any) {
    console.error('Error resetting admin password:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to reset password'
      },
      { status: 500 }
    );
  }
}

