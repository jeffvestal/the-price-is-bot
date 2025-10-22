import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory storage for demo (in production, use a database)
let adminSettings = {
  target_price: 100.0,
  game_duration_minutes: 5,
  current_season: 'fall',
  leaderboard_reset_threshold: 100,
  last_updated: new Date().toISOString(),
  updated_by: 'admin'
};

export async function GET() {
  return NextResponse.json({
    success: true,
    settings: adminSettings
  });
}

export async function POST(request: NextRequest) {
  try {
    // Basic auth check (in production, implement proper admin authentication)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.includes('admin-token')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const updates = await request.json();

    // Validate settings
    if (updates.target_price && (updates.target_price < 10 || updates.target_price > 1000)) {
      return NextResponse.json(
        { success: false, message: 'Target price must be between $10 and $1000' },
        { status: 400 }
      );
    }

    if (updates.game_duration_minutes && (updates.game_duration_minutes < 1 || updates.game_duration_minutes > 60)) {
      return NextResponse.json(
        { success: false, message: 'Game duration must be between 1 and 60 minutes' },
        { status: 400 }
      );
    }

    // Update settings
    adminSettings = {
      ...adminSettings,
      ...updates,
      last_updated: new Date().toISOString(),
      updated_by: 'admin'
    };

    console.log(`✅ Admin settings updated:`, updates);

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      settings: adminSettings
    });

  } catch (error) {
    console.error('❌ Error updating admin settings:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
