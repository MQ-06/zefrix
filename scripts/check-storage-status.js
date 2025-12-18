/**
 * Quick script to check if Firebase Storage is enabled
 * Run this in browser console on your site to verify Storage setup
 */

async function checkFirebaseStorage() {
  console.log('🔍 Checking Firebase Storage status...\n');
  
  // Check if Firebase Storage is initialized
  if (!window.firebaseStorage) {
    console.error('❌ Firebase Storage is NOT initialized');
    console.log('💡 Make sure Storage is enabled in Firebase Console');
    return;
  }
  
  console.log('✅ Firebase Storage is initialized');
  
  // Try to get storage reference (this will fail if Storage is not enabled)
  try {
    if (window.ref) {
      const testRef = window.ref(window.firebaseStorage, 'test/check.txt');
      console.log('✅ Storage reference created successfully');
      console.log('📦 Bucket:', window.firebaseStorage.app.options.storageBucket);
    } else {
      console.error('❌ Storage ref function not available');
    }
  } catch (error) {
    console.error('❌ Error accessing Storage:', error);
    console.log('💡 Storage might not be enabled in Firebase Console');
  }
  
  // Check CORS by trying to make a test request
  const bucket = window.firebaseStorage?.app?.options?.storageBucket;
  if (bucket) {
    console.log('\n🌐 Testing CORS configuration...');
    try {
      const testUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?name=test%2Fcors-check`;
      const response = await fetch(testUrl, { method: 'OPTIONS' });
      if (response.ok || response.status === 404) {
        console.log('✅ CORS preflight request succeeded');
      } else {
        console.warn('⚠️ CORS preflight returned status:', response.status);
        console.log('💡 You may need to configure CORS rules in Google Cloud Console');
      }
    } catch (error) {
      console.error('❌ CORS test failed:', error);
      console.log('💡 CORS rules need to be configured. See FIREBASE_STORAGE_SETUP.md');
    }
  }
  
  console.log('\n📋 Summary:');
  console.log('1. Enable Storage in Firebase Console (upgrade to Blaze plan)');
  console.log('2. Configure CORS rules in Google Cloud Console');
  console.log('3. Set up Storage Security Rules in Firebase Console');
  console.log('\n📖 See FIREBASE_STORAGE_SETUP.md for detailed instructions');
}

// Run if in browser
if (typeof window !== 'undefined') {
  checkFirebaseStorage();
}

