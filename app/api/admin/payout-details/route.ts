import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebase-admin';

interface PayoutDetailsBody {
  creatorId?: string;
  bankDetails?: {
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    upiId?: string;
  };
}

function normalizeBankDetails(bankDetails: PayoutDetailsBody['bankDetails']) {
  return {
    accountHolderName: (bankDetails?.accountHolderName || '').trim(),
    accountNumber: (bankDetails?.accountNumber || '').trim(),
    ifscCode: (bankDetails?.ifscCode || '').trim().toUpperCase(),
    bankName: (bankDetails?.bankName || '').trim(),
    upiId: (bankDetails?.upiId || '').trim().toLowerCase()
  };
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Missing authorization token' }, { status: 401 });
    }

    const idToken = authHeader.slice('Bearer '.length).trim();
    if (!idToken) {
      return NextResponse.json({ success: false, error: 'Invalid authorization token' }, { status: 401 });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const db = admin.firestore();

    const adminUserSnap = await db.collection('users').doc(decodedToken.uid).get();
    const adminUserData = adminUserSnap.exists ? adminUserSnap.data() : null;
    if (!adminUserData || adminUserData.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const body = (await request.json()) as PayoutDetailsBody;
    const creatorId = (body.creatorId || '').trim();
    if (!creatorId) {
      return NextResponse.json({ success: false, error: 'creatorId is required' }, { status: 400 });
    }

    const normalizedDetails = normalizeBankDetails(body.bankDetails);

    const creatorRef = db.collection('users').doc(creatorId);
    await creatorRef.set(
      {
        bankAccountHolderName: normalizedDetails.accountHolderName,
        accountHolderName: normalizedDetails.accountHolderName,
        bankAccountNumber: normalizedDetails.accountNumber,
        accountNumber: normalizedDetails.accountNumber,
        bankIFSC: normalizedDetails.ifscCode,
        ifscCode: normalizedDetails.ifscCode,
        bankName: normalizedDetails.bankName,
        upiId: normalizedDetails.upiId,
        payoutDetailsUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        payoutDetailsUpdatedBy: adminUserData.email || decodedToken.email || decodedToken.uid,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Payout details updated successfully',
      bankDetails: normalizedDetails
    });
  } catch (error: any) {
    console.error('Error updating payout details via admin API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to update payout details'
      },
      { status: 500 }
    );
  }
}
