import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items are required' },
        { status: 400 }
      );
    }

    // Initialize Razorpay
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error('Razorpay keys not configured');
      return NextResponse.json(
        { error: 'Payment gateway not configured' },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });

    // Calculate total amount (in paise, as Razorpay expects amount in smallest currency unit)
    const totalAmount = items.reduce((sum: number, item: any) => {
      return sum + (item.price || 0) * 100; // Convert to paise
    }, 0);

    if (totalAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Create Razorpay order
    const orderOptions = {
      amount: totalAmount, // Amount in paise
      currency: 'INR',
      receipt: `order_${Date.now()}`,
      notes: {
        items: JSON.stringify(items.map((item: any) => ({
          id: item.id,
          title: item.title,
          price: item.price,
        }))),
        itemCount: items.length.toString(),
      },
    };

    const order = await razorpay.orders.create(orderOptions);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: totalAmount,
      currency: order.currency,
      keyId: razorpayKeyId, // Send key ID to frontend for Razorpay checkout
    });
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create order',
      },
      { status: 500 }
    );
  }
}

