import { NextRequest, NextResponse } from 'next/server';
import { addGeneratedCodes, getAllGeneratedCodes, getCodeStats } from '@/lib/codeManager';

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

    const { count, expires_at, batch_name } = await request.json();

    if (!count || count < 1 || count > 1000) {
      return NextResponse.json(
        { success: false, message: 'Count must be between 1 and 1000' },
        { status: 400 }
      );
    }

    const codes: string[] = [];
    const timestamp = new Date().toISOString();
    const newCodes = [];

    // Generate unique access codes
    const existingCodes = getAllGeneratedCodes();
    for (let i = 0; i < count; i++) {
      let code: string;
      do {
        // Generate codes like "ELASTI-XXXX" where X is alphanumeric
        const suffix = Math.random().toString(36).substr(2, 4).toUpperCase();
        code = `ELASTI-${suffix}`;
      } while (existingCodes.some(c => c.code === code) || codes.includes(code));

      codes.push(code);
      newCodes.push({
        code,
        batch_name: batch_name || `batch_${Date.now()}`,
        created_at: timestamp,
        expires_at: expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        used: false
      });
    }

    // Add to the shared code manager
    addGeneratedCodes(newCodes);

    console.log(`✅ Generated ${count} access codes in batch: ${batch_name}`);

    return NextResponse.json({
      success: true,
      message: `Generated ${count} access codes`,
      codes,
      count,
      batch_name,
      expires_at
    });

  } catch (error) {
    console.error('❌ Error generating access codes:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const stats = getCodeStats();
  return NextResponse.json({
    success: true,
    message: 'Access code generation endpoint',
    ...stats
  });
}
