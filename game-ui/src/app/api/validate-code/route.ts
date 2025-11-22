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

    const payload = await request.json();

    const url = new URL('/api/validate-code', LEADERBOARD_API_URL);
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('❌ Validate-code proxy error:', response.status, text);
      return NextResponse.json(
        { success: false, message: 'Access code validation failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Access code validation error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Access code validation endpoint'
  });
}