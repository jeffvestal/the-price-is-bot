import { NextRequest, NextResponse } from 'next/server';
import { isValidAccessCode, markCodeAsUsed, STATIC_DEMO_CODES, getCodeStats } from '@/lib/codeManager';

export async function POST(request: NextRequest) {
  try {
    const { access_code, player_name, player_email, company } = await request.json();

    // Validate required fields
    if (!access_code || !player_name || !player_email) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Access code, name, and email are required' 
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(player_email)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Please enter a valid email address' 
        },
        { status: 400 }
      );
    }

    // Check if access code is valid
    if (!isValidAccessCode(access_code)) {
      console.log(`❌ Invalid access code attempted: ${access_code}`);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid or expired access code. Please check your code and try again.' 
        },
        { status: 401 }
      );
    }

    // Mark generated codes as used (static demo codes can be reused)
    if (!STATIC_DEMO_CODES.includes(access_code.toUpperCase())) {
      markCodeAsUsed(access_code, player_email);
    }

    console.log(`✅ Valid access code used: ${access_code} by ${player_name} (${player_email})`);

    // Create session data
    const sessionData = {
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      accessCode: access_code.toUpperCase(),
      playerName: player_name,
      playerEmail: player_email,
      company: company || null,
      targetPrice: 100, // Default target price
      startTime: new Date().toISOString(),
      gameSettings: {
        timeLimit: 300, // 5 minutes in seconds
        maxItems: 20,
        allowOverBudget: false,
      }
    };

    return NextResponse.json({
      success: true,
      message: 'Access code validated successfully',
      session: sessionData,
    });

  } catch (error) {
    console.error('❌ Access code validation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Server error. Please try again.' 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check available demo codes and stats
export async function GET() {
  const stats = getCodeStats();
  
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.json({
      success: true,
      message: 'Available access codes',
      demo_codes: STATIC_DEMO_CODES,
      stats
    });
  }
  
  return NextResponse.json({
    success: true,
    message: 'Access code validation endpoint',
    stats: {
      total_static: stats.total_static,
      active_codes: stats.active_codes
    }
  });
}