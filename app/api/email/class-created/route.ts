import { NextRequest, NextResponse } from 'next/server';
import { sendClassCreatedEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { creatorName, creatorEmail, className, classId, category, price } = body;

        if (!className || !classId) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        await sendClassCreatedEmail({
            creatorName: creatorName || 'Creator',
            creatorEmail: creatorEmail || '',
            className,
            classId,
            category: category || '',
            price: price || 0,
        });

        return NextResponse.json({ success: true, message: 'Email sent successfully' });
    } catch (error: any) {
        console.error('Error sending class created email:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to send email' },
            { status: 500 }
        );
    }
}

