import admin from 'firebase-admin';

type UserRole = 'student' | 'creator' | 'admin';

export interface NotificationPayload {
  type: string;
  title: string;
  message: string;
  link?: string;
  relatedId?: string;
  metadata?: Record<string, any>;
}

const FALLBACK_ADMIN_EMAILS = [
  'kartik@zefrix.com',
  'mariamqadeem181@gmail.com',
  process.env.ADMIN_EMAIL || '',
].filter(Boolean);

function dedupeIds(ids: Array<string | null | undefined>): string[] {
  return Array.from(new Set(ids.filter((id): id is string => !!id && typeof id === 'string')));
}

export async function getUserIdsByRole(
  db: admin.firestore.Firestore,
  role: UserRole,
): Promise<string[]> {
  const snapshot = await db.collection('users').where('role', '==', role).get();
  return dedupeIds(snapshot.docs.map((doc) => doc.id));
}

export async function getAdminUserIds(db: admin.firestore.Firestore): Promise<string[]> {
  const roleAdmins = await getUserIdsByRole(db, 'admin');

  const fallbackLookups = await Promise.all(
    FALLBACK_ADMIN_EMAILS.map(async (email) => {
      const snap = await db.collection('users').where('email', '==', email).limit(1).get();
      return snap.empty ? null : snap.docs[0].id;
    }),
  );

  return dedupeIds([...roleAdmins, ...fallbackLookups]);
}

export async function createNotificationsForUsers(
  db: admin.firestore.Firestore,
  userIds: string[],
  userRole: UserRole,
  payload: NotificationPayload,
): Promise<number> {
  const uniqueIds = dedupeIds(userIds);
  if (!uniqueIds.length) return 0;

  const notificationsRef = db.collection('notifications');
  const writes = uniqueIds.map((userId) =>
    notificationsRef.add({
      userId,
      userRole,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      link: payload.link || null,
      relatedId: payload.relatedId || null,
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      metadata: payload.metadata || {},
    }),
  );

  await Promise.all(writes);
  return uniqueIds.length;
}

export async function createAdminNotification(
  db: admin.firestore.Firestore,
  payload: NotificationPayload,
): Promise<number> {
  const adminIds = await getAdminUserIds(db);
  return createNotificationsForUsers(db, adminIds, 'admin', payload);
}

export async function createNotificationForRole(
  db: admin.firestore.Firestore,
  role: UserRole,
  payload: NotificationPayload,
): Promise<number> {
  const userIds = await getUserIdsByRole(db, role);
  return createNotificationsForUsers(db, userIds, role, payload);
}

export async function createNotificationForUser(
  db: admin.firestore.Firestore,
  userId: string,
  role: UserRole,
  payload: NotificationPayload,
): Promise<void> {
  await createNotificationsForUsers(db, [userId], role, payload);
}
