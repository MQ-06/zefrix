import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
            items, // Array of cart items
            studentId,
            studentEmail,
            studentName,
        } = body;

        // Verify Razorpay signature
        const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!razorpayKeySecret) {
            return NextResponse.json(
                { success: false, error: 'Payment gateway not configured' },
                { status: 500 }
            );
        }

        // Verify signature
        const text = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSignature = crypto
            .createHmac('sha256', razorpayKeySecret)
            .update(text)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            console.error('Signature verification failed', {
                expected: expectedSignature,
                received: razorpay_signature,
            });
            return NextResponse.json(
                { success: false, error: 'Invalid payment signature' },
                { status: 400 }
            );
        }

        console.log('✅ Payment signature verified successfully');

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No items provided for enrollment' },
                { status: 400 }
            );
        }

        // Calculate total amount
        const totalAmount = items.reduce((sum: number, item: any) => sum + (item.price || 0), 0);

        // Return success with items data
        // Enrollment creation will happen on frontend after verification
        // This ensures payment is verified before creating enrollments
        const enrollmentIds: string[] = [];

        // Send to n8n webhook for each item
        const webhookPromises = items.map(async (item: any) => {
            try {
                const n8nPayload = {
                    payment_id: razorpay_payment_id,
                    order_id: razorpay_order_id,
                    name: studentName,
                    email: studentEmail,
                    amount: item.price,
                    status: 'captured',
                    class_id: item.id,
                    class_name: item.title,
                    student_id: studentId,
                    enrolled_at: new Date().toISOString()
                };

                const webhookResponse = await fetch('https://n8n.srv1137454.hstgr.cloud/webhook-test/razorpay-payment', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(n8nPayload),
                });

                if (webhookResponse.ok) {
                    console.log(`✅ n8n webhook called successfully for class ${item.id}`);
                } else {
                    console.warn(`⚠️ n8n webhook failed for class ${item.id} (non-blocking)`);
                }
            } catch (webhookError) {
                console.error(`Webhook error for class ${item.id} (non-blocking):`, webhookError);
            }
        });

        await Promise.all(webhookPromises);

        // Return success response with items data
        // Frontend will create enrollments after receiving this success response
        return NextResponse.json({
            success: true,
            message: 'Payment verified successfully',
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            items: items, // Return items so frontend can create enrollments
            studentId: studentId,
            studentEmail: studentEmail,
            studentName: studentName,
            totalAmount: totalAmount,
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
