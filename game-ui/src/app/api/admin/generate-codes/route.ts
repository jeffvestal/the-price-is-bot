import { NextRequest, NextResponse } from 'next/server';

const LEADERBOARD_API_URL = process.env.NEXT_PUBLIC_LEADERBOARD_API_URL;

export async function POST(request: NextRequest) {
  try {
    if (!LEADERBOARD_API_URL) {
      return NextResponse.json(
        { success: false, message: 'Leaderboard API URL not configured' },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get('authorization') || '';
    const payload = await request.json();

    const url = new URL('/admin/generate-codes', LEADERBOARD_API_URL);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error('❌ Error generating access codes:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Access code generation endpoint'
  });
}
