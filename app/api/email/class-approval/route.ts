import { NextRequest, NextResponse } from 'next/server';
import { sendClassApprovalEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { creatorName, creatorEmail, className, classId, status, rejectionReason } = body;

        if (!creatorEmail || !className || !status) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        await sendClassApprovalEmail({
            creatorName: creatorName || 'Creator',
            creatorEmail,
            className,
            classId: classId || '',
            status: status === 'approved' ? 'approved' : 'rejected',
            rejectionReason,
        });

        return NextResponse.json({ success: true, message: 'Email sent successfully' });
    } catch (error: any) {
        console.error('Error sending class approval email:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to send email' },
            { status: 500 }
        );
    }
}

