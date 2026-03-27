/**
 * Script to create an admin user
 * Usage: node scripts/create-admin-user.js
 */

const admin = require('firebase-admin');
const readFileSync = require('fs').readFileSync;
const join = require('path').join;

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    const serviceAccountPath = join(process.cwd(), 'firebase-service-account.json');
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error.message);
    process.exit(1);
  }
}

const db = admin.firestore();
const auth = admin.auth();

async function createAdminUser(email, password, name) {
  try {
    console.log(`\n📧 Creating admin user: ${email}`);
    
    // Create user in Firebase Auth
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log(`⚠️  User already exists in Firebase Auth: ${email}`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Create new user
        userRecord = await auth.createUser({
          email: email,
          password: password,
          displayName: name,
          emailVerified: true,
        });
        console.log(`✅ User created in Firebase Auth: ${userRecord.uid}`);
      } else {
        throw error;
      }
    }

    // Create or update user document in Firestore
    const userRef = db.collection('users').doc(userRecord.uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      // Update existing user to admin
      await userRef.update({
        role: 'admin',
        email: email,
        name: name || email.split('@')[0],
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`✅ Updated existing user to admin role in Firestore`);
    } else {
      // Create new user document
      await userRef.set({
        uid: userRecord.uid,
        email: email,
        name: name || email.split('@')[0],
        role: 'admin',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`✅ Created new admin user document in Firestore`);
    }

    console.log(`\n✅ Admin user setup complete!`);
    console.log(`   Email: ${email}`);
    console.log(`   User ID: ${userRecord.uid}`);
    console.log(`   Role: admin`);
    console.log(`\n🔑 Password: ${password}`);
    console.log(`   (Please save this password securely)`);

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    process.exit(1);
  }
}

// Run the script
const email = 'kartik@zefrix.com';
const password = 'moonglade<journey>8';
const name = 'Kartik';

createAdminUser(email, password, name)
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

