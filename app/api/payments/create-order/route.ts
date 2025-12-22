import { NextRequest, NextResponse } from 'next/server';

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

    console.log('Razorpay config check:', {
      hasKeyId: !!razorpayKeyId,
      hasKeySecret: !!razorpayKeySecret,
      keyIdPrefix: razorpayKeyId?.substring(0, 8),
    });

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error('Razorpay keys not configured', {
        RAZORPAY_KEY_ID: !!razorpayKeyId,
        RAZORPAY_KEY_SECRET: !!razorpayKeySecret,
        allEnvKeys: Object.keys(process.env).filter(k => k.includes('RAZORPAY')),
      });
      return NextResponse.json(
        { 
          error: 'Payment gateway not configured',
          message: 'Please ensure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set in .env.local and restart the server',
        },
        { status: 500 }
      );
    }

    // Use Razorpay REST API directly (no npm package needed)
    const auth = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64');

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

    // Validate minimum amount (Razorpay minimum is 100 paise = ₹1)
    if (totalAmount < 100) {
      return NextResponse.json(
        { error: 'Minimum order amount is ₹1.00' },
        { status: 400 }
      );
    }

    // Create Razorpay order using REST API
    // Receipt must be alphanumeric only (no special chars to avoid WAF blocking)
    const receiptId = `ZEFRIX${Date.now()}`.substring(0, 40).replace(/[^a-zA-Z0-9]/g, '');
    
    // Ensure all data is valid and properly formatted (prevent invalid request data)
    const orderData = {
      amount: parseInt(totalAmount.toString(), 10), // Ensure integer (not float)
      currency: 'INR', // Must be valid currency code
      receipt: receiptId, // Alphanumeric only, max 40 chars
    };

    // Validate order data before sending (prevent invalid request data errors)
    if (!Number.isInteger(orderData.amount) || orderData.amount < 100) {
      throw new Error('Invalid amount: Must be integer >= 100 paise');
    }
    if (orderData.currency !== 'INR') {
      throw new Error('Invalid currency: Only INR is supported');
    }
    if (!orderData.receipt || orderData.receipt.length > 40 || orderData.receipt.length === 0) {
      throw new Error('Invalid receipt: Must be 1-40 alphanumeric characters');
    }

    console.log('Creating Razorpay order via REST API:', {
      amount: orderData.amount,
      currency: orderData.currency,
      receipt: orderData.receipt,
    });

    // 🔍 DEBUG - About to call Razorpay API
    console.log('🔍 DEBUG - About to call Razorpay API:');
    console.log('URL:', 'https://api.razorpay.com/v1/orders');
    console.log('Auth header present:', !!auth);
    console.log('Auth length:', auth?.length);
    console.log('Order data:', JSON.stringify(orderData, null, 2));
    console.log('Headers:', {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Basic ${auth.substring(0, 20)}...`,
      'X-Razorpay-Account': razorpayKeyId,
    });

    // Call Razorpay Orders API directly
    // Ensure all headers are correctly set to avoid 406 error
    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${auth}`,
        'User-Agent': 'Zefrix-Platform/1.0',
        'X-Razorpay-Account': razorpayKeyId, // Add this
      },
      body: JSON.stringify(orderData),
    });

    // Read response text first to see what Razorpay actually returns
    const responseText = await razorpayResponse.text();
    
    // 🔍 DEBUG - Response received
    console.log('🔍 DEBUG - Razorpay API Response:');
    console.log('Status:', razorpayResponse.status);
    console.log('Status Text:', razorpayResponse.statusText);
    console.log('Response Headers:', Object.fromEntries(razorpayResponse.headers.entries()));
    console.log('Response Text Length:', responseText.length);
    console.log('Response Text (first 500 chars):', responseText.substring(0, 500));
    
    if (!razorpayResponse.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        errorData = { rawResponse: responseText };
      }
      
      console.error('Razorpay API error details:', {
        status: razorpayResponse.status,
        statusText: razorpayResponse.statusText,
        errorData: errorData,
        responseText: responseText.substring(0, 500), // First 500 chars
        requestData: orderData,
      });
      
      // 406 usually means account not activated or API restrictions
      const errorMessage = errorData.error?.description || 
                          errorData.error?.reason || 
                          errorData.message ||
                          (razorpayResponse.status === 406 
                            ? 'Razorpay account may not be activated. Please check your Razorpay dashboard and ensure your test account is fully activated.'
                            : `Razorpay API error (${razorpayResponse.status})`);
      
      throw new Error(errorMessage);
    }

    const order = JSON.parse(responseText);
    console.log('Razorpay order created successfully:', order.id);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: totalAmount,
      currency: order.currency,
      keyId: razorpayKeyId, // Send key ID to frontend for Razorpay checkout
    });
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create order',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

