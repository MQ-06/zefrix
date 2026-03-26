import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebase-admin';

type ManageUserAction = 'set-password' | 'suspend-user' | 'delete-user';

interface ManageUserBody {
  action?: ManageUserAction;
  userId?: string;
  newPassword?: string;
  suspended?: boolean;
  hardDelete?: boolean;
}

async function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    throw new Error('Missing authorization token');
  }

  const idToken = authHeader.slice('Bearer '.length).trim();
  if (!idToken) {
    throw new Error('Invalid authorization token');
  }

  const decodedToken = await admin.auth().verifyIdToken(idToken);
  const db = admin.firestore();
  const adminUserSnap = await db.collection('users').doc(decodedToken.uid).get();
  const adminUserData = adminUserSnap.exists ? adminUserSnap.data() : null;

  if (!adminUserData || adminUserData.role !== 'admin') {
    throw new Error('Admin access required');
  }

  return {
    db,
    adminUser: adminUserData,
    actorId: decodedToken.uid,
    actorEmail: adminUserData.email || decodedToken.email || decodedToken.uid,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { db, actorEmail } = await requireAdmin(request);
    const body = (await request.json()) as ManageUserBody;

    const action = body.action;
    const userId = (body.userId || '').trim();

    if (!action) {
      return NextResponse.json({ success: false, error: 'action is required' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
    }

    const userRef = db.collection('users').doc(userId);

    if (action === 'set-password') {
      const newPassword = (body.newPassword || '').trim();
      if (newPassword.length < 6) {
        return NextResponse.json({ success: false, error: 'newPassword must be at least 6 characters' }, { status: 400 });
      }

      await admin.auth().updateUser(userId, { password: newPassword });
      await userRef.set(
        {
          passwordChangedAt: admin.firestore.FieldValue.serverTimestamp(),
          passwordChangedBy: actorEmail,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      return NextResponse.json({
        success: true,
        message: 'Password updated successfully',
      });
    }

    if (action === 'suspend-user') {
      const suspended = !!body.suspended;
      await admin.auth().updateUser(userId, { disabled: suspended });

      await userRef.set(
        {
          isSuspended: suspended,
          accountStatus: suspended ? 'suspended' : 'active',
          suspendedAt: suspended ? admin.firestore.FieldValue.serverTimestamp() : null,
          suspendedBy: suspended ? actorEmail : null,
          reactivatedAt: suspended ? null : admin.firestore.FieldValue.serverTimestamp(),
          reactivatedBy: suspended ? null : actorEmail,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      return NextResponse.json({
        success: true,
        message: suspended ? 'User suspended successfully' : 'User activated successfully',
      });
    }

    if (action === 'delete-user') {
      const hardDelete = !!body.hardDelete;

      if (hardDelete) {
        await Promise.all([
          admin.auth().deleteUser(userId),
          userRef.delete(),
        ]);

        return NextResponse.json({
          success: true,
          message: 'User deleted permanently',
          hardDelete: true,
        });
      }

      await admin.auth().updateUser(userId, { disabled: true });
      await userRef.set(
        {
          isDeleted: true,
          deletedAt: admin.firestore.FieldValue.serverTimestamp(),
          deletedBy: actorEmail,
          accountStatus: 'deleted',
          isSuspended: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      return NextResponse.json({
        success: true,
        message: 'User account deleted (disabled) successfully',
        hardDelete: false,
      });
    }

    return NextResponse.json({ success: false, error: 'Unsupported action' }, { status: 400 });
  } catch (error: any) {
    const message = error?.message || 'Failed to manage user account';
    const statusCode = message.includes('authorization') || message.includes('Admin access') ? 403 : 500;
    console.error('Error in admin/manage-user:', error);
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: statusCode },
    );
  }
}
