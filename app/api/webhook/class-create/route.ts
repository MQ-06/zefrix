import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Forward to n8n webhook
    const n8nWebhookUrl = 'https://n8n.srv1137454.hstgr.cloud/webhook-test/class-create';
    
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const responseData = await response.text();
    
    return NextResponse.json(
      { 
        success: response.ok,
        message: response.ok ? 'Webhook sent successfully' : 'Webhook failed',
        data: responseData 
      },
      { status: response.ok ? 200 : response.status }
    );
  } catch (error: any) {
    console.error('Webhook proxy error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to send webhook' 
      },
      { status: 500 }
    );
  }
}

