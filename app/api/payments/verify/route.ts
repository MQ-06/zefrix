import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { sendEnrollmentConfirmationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
    let requestBody: any = {};
    
    try {
        requestBody = await request.json();
        const {
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
            items, // Array of cart items
            studentId,
            studentEmail,
            studentName,
        } = requestBody;

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
            console.error('Payment verification: No items provided');
            return NextResponse.json(
                { 
                    success: false, 
                    error: 'No items provided for enrollment. Please contact support with your Payment ID.',
                    paymentId: razorpay_payment_id,
                },
                { status: 400 }
            );
        }

        if (!studentId || !studentEmail) {
            console.error('Payment verification: Missing student information');
            return NextResponse.json(
                { 
                    success: false, 
                    error: 'Student information is missing. Please contact support.',
                    paymentId: razorpay_payment_id,
                },
                { status: 400 }
            );
        }

        // Calculate total amount
        const totalAmount = items.reduce((sum: number, item: any) => sum + (item.price || 0), 0);
        
        if (totalAmount <= 0) {
            console.error('Payment verification: Invalid total amount', totalAmount);
            return NextResponse.json(
                { 
                    success: false, 
                    error: 'Invalid payment amount. Please contact support.',
                    paymentId: razorpay_payment_id,
                },
                { status: 400 }
            );
        }

        // Send enrollment confirmation emails (non-blocking)
        console.log(`📧 Sending enrollment emails for ${items.length} classes to student: ${studentId} (${studentEmail})`);
        const emailPromises = items.map(async (item: any) => {
            try {
                console.log(`📝 Processing enrollment email for class: ${item.id} (${item.title}), studentId: ${studentId}`);
                await sendEnrollmentConfirmationEmail({
                    studentName,
                    studentEmail,
                    studentId,
                    className: item.title,
                    classId: item.id,
                    paymentId: razorpay_payment_id,
                    orderId: razorpay_order_id,
                    amount: item.price,
                });
                console.log(`✅ Enrollment email and notification processed for class: ${item.id}`);
            } catch (emailError) {
                console.error(`❌ Error sending enrollment email for class ${item.id}:`, emailError);
                // Don't throw - email failure shouldn't block payment verification
            }
        });

        // Send emails in background (don't await to avoid blocking response)
        Promise.all(emailPromises).catch((err) => {
            console.error('Error sending enrollment emails:', err);
        });

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
        console.error('Error stack:', error.stack);
        
        // Return detailed error information for debugging (but don't expose sensitive info in production)
        const errorMessage = error.message || 'Payment verification failed';
        const errorResponse: any = {
            success: false,
            error: errorMessage,
        };
        
        // Include additional details in development
        if (process.env.NODE_ENV === 'development') {
            errorResponse.details = error.stack;
        }
        
        return NextResponse.json(
            errorResponse,
            { status: 500 }
        );
    }
}
