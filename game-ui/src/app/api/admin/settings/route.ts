import { NextRequest, NextResponse } from 'next/server';

const LEADERBOARD_API_URL = process.env.NEXT_PUBLIC_LEADERBOARD_API_URL;

export async function GET() {
  try {
    if (!LEADERBOARD_API_URL) {
      return NextResponse.json(
        { success: false, message: 'Leaderboard API URL not configured' },
        { status: 500 }
      );
    }
    const url = new URL('/api/settings', LEADERBOARD_API_URL);
    const response = await fetch(url.toString(), { method: 'GET' });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Admin settings GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch admin settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!LEADERBOARD_API_URL) {
      return NextResponse.json(
        { success: false, message: 'Leaderboard API URL not configured' },
        { status: 500 }
      );
    }

    const updates = await request.json();
    const url = new URL('/admin/settings', LEADERBOARD_API_URL);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward bearer token if provided
        'Authorization': request.headers.get('authorization') || ''
      },
      body: JSON.stringify(updates)
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error('❌ Admin settings POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update admin settings' },
      { status: 500 }
    );
  }
}
