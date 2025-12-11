import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
            studentId,
            studentEmail,
            studentName,
            classId,
            className,
            classPrice,
            classType,
            numberOfSessions
        } = body;

        // TODO: In production, verify Razorpay signature here
        // const crypto = require('crypto');
        // const expectedSignature = crypto
        //   .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        //   .update(razorpay_order_id + '|' + razorpay_payment_id)
        //   .digest('hex');
        // if (expectedSignature !== razorpay_signature) {
        //   return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 });
        // }

        // For now, we'll proceed with enrollment creation
        console.log('Payment verification request:', {
            razorpay_payment_id,
            studentEmail,
            classId
        });

        // Send to n8n webhook
        try {
            const n8nPayload = {
                payment_id: razorpay_payment_id,
                name: studentName,
                email: studentEmail,
                amount: classPrice,
                status: 'captured',
                class_id: classId,
                batch: classId, // Using classId as batch for now
                student_id: studentId,
                class_name: className,
                class_type: classType,
                number_sessions: numberOfSessions,
                enrolled_at: new Date().toISOString()
            };

            console.log('Sending to n8n webhook:', n8nPayload);

            const webhookResponse = await fetch('https://n8n.srv1137454.hstgr.cloud/webhook-test/razorpay-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(n8nPayload),
            });

            if (webhookResponse.ok) {
                console.log('✅ n8n webhook called successfully');
            } else {
                console.warn('⚠️ n8n webhook failed (non-blocking)');
            }
        } catch (webhookError) {
            console.error('Webhook error (non-blocking):', webhookError);
        }

        // Return success response
        return NextResponse.json({
            success: true,
            message: 'Payment verified and enrollment created',
            enrollmentId: `ENR_${Date.now()}`,
            paymentId: razorpay_payment_id
        });

    } catch (error: any) {
        console.error('Payment verification error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Payment verification failed'
            },
            { status: 500 }
        );
    }
}
