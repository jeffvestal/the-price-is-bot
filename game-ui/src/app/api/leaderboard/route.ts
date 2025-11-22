import { NextRequest, NextResponse } from 'next/server';

const LEADERBOARD_API_URL = process.env.NEXT_PUBLIC_LEADERBOARD_API_URL;

export async function GET(request: NextRequest) {
  try {
    if (!LEADERBOARD_API_URL) {
      return NextResponse.json(
        { success: false, message: 'Leaderboard API URL not configured' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const date = searchParams.get('date') || undefined;

    const url = new URL('/api/leaderboard', LEADERBOARD_API_URL);
    if (limit) url.searchParams.set('limit', String(limit));
    if (date) url.searchParams.set('date', date);

    const response = await fetch(url.toString(), { method: 'GET' });

    if (!response.ok) {
      const text = await response.text();
      console.error('❌ Leaderboard proxy error:', response.status, text);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch leaderboard' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Leaderboard error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch leaderboard' },
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

    const payload = await request.json();
    
    // Transform frontend payload (camelCase) to API format (snake_case)
    const apiPayload = {
      session_id: payload.sessionId,
      selected_agent: payload.agentUsed,
      items_selected: payload.items || [],
      total_price: payload.totalPrice,
      game_duration: payload.timeUsed
    };
    
    const url = new URL('/api/submit-game', LEADERBOARD_API_URL);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiPayload)
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('❌ Submit game proxy error:', response.status, text);
      return NextResponse.json(
        { success: false, message: 'Failed to submit game result' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Submit game error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to submit game result' },
      { status: 500 }
    );
  }
}
