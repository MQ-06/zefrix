import { NextRequest, NextResponse } from 'next/server';
import { sendCreatorPayoutReleasedEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      creatorName,
      creatorEmail,
      amount,
      classCount,
      enrollmentCount,
      releasedBy,
    } = body;

    if (!creatorEmail || amount === undefined || amount === null) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: creatorEmail and amount' },
        { status: 400 },
      );
    }

    await sendCreatorPayoutReleasedEmail({
      creatorName: creatorName || 'Creator',
      creatorEmail,
      amount: Number(amount || 0),
      classCount: Number(classCount || 0),
      enrollmentCount: Number(enrollmentCount || 0),
      releasedBy: releasedBy || 'Admin',
    });

    return NextResponse.json({ success: true, message: 'Payout release email queued' });
  } catch (error: any) {
    console.error('Error sending payout release email:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send payout release email' },
      { status: 500 },
    );
  }
}
