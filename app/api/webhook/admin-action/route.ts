import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const classId = searchParams.get('class_id');
    const action = searchParams.get('action');
    
    if (!classId || !action) {
      return NextResponse.json(
        { error: 'Missing class_id or action parameter' },
        { status: 400 }
      );
    }
    
    // Forward to n8n webhook
    const n8nWebhookUrl = `https://n8n.srv1137454.hstgr.cloud/webhook-test/admin-action?class_id=${encodeURIComponent(classId)}&action=${encodeURIComponent(action)}`;
    
    const response = await fetch(n8nWebhookUrl, {
      method: 'GET',
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

