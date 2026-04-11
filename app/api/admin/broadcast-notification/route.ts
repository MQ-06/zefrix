import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';

if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_ADMIN_SDK_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_KEY);
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({ credential: admin.credential.applicationDefault() });
    } else {
      const serviceAccountPath = join(process.cwd(), 'firebase-service-account.json');
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    }
  } catch (e: any) {
    console.error('Firebase Admin init error:', e.message);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { target, userId, title, message, link, sentBy } = body;

    // target: 'all-students' | 'all-creators' | 'all-users' | 'specific-user'
    if (!target || !title || !message) {
      return NextResponse.json({ success: false, error: 'target, title, and message are required' }, { status: 400 });
    }
    if (target === 'specific-user' && !userId) {
      return NextResponse.json({ success: false, error: 'userId required for specific-user target' }, { status: 400 });
    }

    const db = admin.firestore();
    const batch = db.batch();
    let count = 0;

    const buildNotif = (uid: string, role: string) => ({
      userId: uid,
      userRole: role,
      type: 'admin_broadcast',
      title,
      message,
      link: link || null,
      isRead: false,
      sentBy: sentBy || 'admin',
      metadata: { broadcast: true, target },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    if (target === 'specific-user') {
      const userSnap = await db.collection('users').doc(userId).get();
      if (!userSnap.exists) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }
      const userData = userSnap.data()!;
      const ref = db.collection('notifications').doc();
      batch.set(ref, buildNotif(userId, userData.role || 'student'));
      count = 1;
    } else {
      // Query target users
      const usersRef = db.collection('users');
      let usersQuery: admin.firestore.Query;

      if (target === 'all-students') {
        usersQuery = usersRef.where('role', '==', 'student');
      } else if (target === 'all-creators') {
        usersQuery = usersRef.where('role', '==', 'creator');
      } else {
        // all-users: fetch everyone except admins
        usersQuery = usersRef.where('role', 'in', ['student', 'creator']);
      }

      const usersSnap = await usersQuery.get();

      // Firestore batch limit is 500 writes — chunk if needed
      const BATCH_SIZE = 490;
      let localBatch = db.batch();
      let batchCount = 0;
      const batches: admin.firestore.WriteBatch[] = [localBatch];

      usersSnap.forEach((doc) => {
        const userData = doc.data();
        if (!userData.isDeleted && !userData.isSuspended) {
          const ref = db.collection('notifications').doc();
          localBatch.set(ref, buildNotif(doc.id, userData.role || 'student'));
          batchCount++;
          count++;

          if (batchCount >= BATCH_SIZE) {
            localBatch = db.batch();
            batches.push(localBatch);
            batchCount = 0;
          }
        }
      });

      await Promise.all(batches.map((b) => b.commit()));
      console.log(`✅ Broadcast sent to ${count} users (target: ${target})`);

      return NextResponse.json({ success: true, sent: count, target });
    }

    await batch.commit();
    return NextResponse.json({ success: true, sent: count, target });
  } catch (error: any) {
    console.error('Broadcast notification error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
