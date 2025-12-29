import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeyId || !razorpayKeySecret) {
      return NextResponse.json({
        success: false,
        error: 'Keys not configured',
      }, { status: 500 });
    }

    // Test with minimal order
    const auth = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64');
    
    const testOrder = {
      amount: 100, // ₹1.00
      currency: 'INR',
      receipt: `TEST${Date.now()}`,
    };

    console.log('Testing Razorpay API keys with minimal order:', testOrder);

    // Try with minimal headers first
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`,
    };

    // Only add Accept header if needed
    headers['Accept'] = 'application/json';

    console.log('Making request with headers:', Object.keys(headers));
    console.log('Request body:', JSON.stringify(testOrder));

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(testOrder),
    });

    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('Razorpay test response:', {
      status: response.status,
      statusText: response.statusText,
      responseText: responseText.substring(0, 500),
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        errorData = { rawResponse: responseText };
      }

      return NextResponse.json({
        success: false,
        status: response.status,
        error: errorData,
        responseText: responseText,
        message: 'Razorpay API test failed',
      }, { status: 200 }); // Return 200 so we can see the error details
    }

    const order = JSON.parse(responseText);

    return NextResponse.json({
      success: true,
      message: 'Razorpay API keys are working!',
      orderId: order.id,
      order: order,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}

