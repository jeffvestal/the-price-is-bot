import { NextRequest, NextResponse } from 'next/server';

// Mock leaderboard data for development
const MOCK_LEADERBOARD = [
  {
    id: '1',
    playerName: 'Alice Chen',
    company: 'Tech Corp',
    score: 98.5,
    totalPrice: 98.50,
    targetPrice: 100,
    itemCount: 12,
    timeUsed: 245, // seconds
    completedAt: '2024-10-06T10:30:00Z',
    agentUsed: 'Budget Master'
  },
  {
    id: '2', 
    playerName: 'Bob Martinez',
    company: 'StartupXYZ',
    score: 95.2,
    totalPrice: 95.20,
    targetPrice: 100,
    itemCount: 8,
    timeUsed: 180,
    completedAt: '2024-10-06T09:15:00Z',
    agentUsed: 'Health Guru'
  },
  {
    id: '3',
    playerName: 'Carol Johnson', 
    company: 'Enterprise Inc',
    score: 92.8,
    totalPrice: 92.80,
    targetPrice: 100,
    itemCount: 15,
    timeUsed: 290,
    completedAt: '2024-10-06T08:45:00Z',
    agentUsed: 'Gourmet Chef'
  },
  {
    id: '4',
    playerName: 'David Kim',
    company: 'Innovation Labs',
    score: 89.1,
    totalPrice: 89.10,
    targetPrice: 100,
    itemCount: 6,
    timeUsed: 120,
    completedAt: '2024-10-06T11:20:00Z',
    agentUsed: 'Speed Shopper'
  },
  {
    id: '5',
    playerName: 'Emma Wilson',
    company: 'Global Solutions',
    score: 87.6,
    totalPrice: 87.60,
    targetPrice: 100,
    itemCount: 10,
    timeUsed: 200,
    completedAt: '2024-10-06T07:30:00Z',
    agentUsed: 'Vegas Local Expert'
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // In a real implementation, this would query a database
    // For now, return mock data
    const leaderboard = MOCK_LEADERBOARD
      .sort((a, b) => b.score - a.score) // Sort by score descending
      .slice(offset, offset + limit);

    console.log(`📊 Leaderboard requested: limit=${limit}, offset=${offset}, returned=${leaderboard.length} entries`);

    return NextResponse.json({
      success: true,
      data: leaderboard,
      total: MOCK_LEADERBOARD.length,
      limit,
      offset,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Leaderboard error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch leaderboard' 
      },
      { status: 500 }
    );
  }
}

// POST endpoint to submit a game result
export async function POST(request: NextRequest) {
  try {
    const gameResult = await request.json();
    
    const {
      sessionId,
      playerName,
      playerEmail,
      company,
      totalPrice,
      targetPrice,
      items,
      timeUsed,
      agentUsed
    } = gameResult;

    // Validate required fields
    if (!sessionId || !playerName || !totalPrice || !targetPrice) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required fields' 
        },
        { status: 400 }
      );
    }

    // Calculate score with strict rules
    let finalScore = 0;
    
    // Rule 1: Must have exactly 5 bags (unique items)
    const uniqueItems = items ? new Set(items.map((item: any) => item.name)).size : 0;
    if (uniqueItems !== 5) {
      console.log(`❌ Score = 0: Wrong number of bags (${uniqueItems}/5)`);
      finalScore = 0;
    }
    // Rule 2: Cannot spend over $100.00
    else if (totalPrice > targetPrice) {
      console.log(`❌ Score = 0: Over budget ($${totalPrice}/$${targetPrice})`);
      finalScore = 0;
    }
    // Rule 3: Maximum 5 items per bag
    else if (items && items.some((item: any) => item.quantity > 5)) {
      const violatingItems = items.filter((item: any) => item.quantity > 5);
      console.log(`❌ Score = 0: Items exceed max per bag (5 max):`, violatingItems.map((i: any) => `${i.name}: ${i.quantity}`));
      finalScore = 0;
    }
    // Rule 4: Each bag must contain only one unique item type (already enforced by game logic)
    // This is handled by the frontend constraint, but we validate uniqueItems count above
    else {
      // Valid game - calculate score based on proximity to target
      const difference = Math.abs(targetPrice - totalPrice);
      const baseScore = Math.max(0, targetPrice - difference);
      
      // Bonus for being under budget (but not over)
      const underBudgetBonus = totalPrice <= targetPrice ? 5 : 0;
      
      // Time bonus (max 10 points for games under 2 minutes)
      const timeBonus = timeUsed < 120 ? Math.max(0, 10 - (timeUsed / 12)) : 0;
      
      finalScore = baseScore + underBudgetBonus + timeBonus;
      console.log(`✅ Valid game: Base=${baseScore}, Budget Bonus=${underBudgetBonus}, Time Bonus=${timeBonus.toFixed(1)}, Final=${finalScore.toFixed(1)}`);
    }

    const leaderboardEntry = {
      id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      playerName,
      playerEmail,
      company: company || null,
      score: finalScore,
      totalPrice,
      targetPrice,
      itemCount: items?.length || 0,
      timeUsed,
      completedAt: new Date().toISOString(),
      agentUsed: agentUsed || 'Unknown',
      items: items || []
    };

    console.log(`🏆 Game result submitted: ${playerName} scored ${finalScore} with $${totalPrice}`);

    // Store the result in our leaderboard
    MOCK_LEADERBOARD.push(leaderboardEntry);
    
    // Sort leaderboard by score (highest first)
    MOCK_LEADERBOARD.sort((a, b) => b.score - a.score);
    
    // Keep only top 50 entries to prevent unlimited growth
    if (MOCK_LEADERBOARD.length > 50) {
      MOCK_LEADERBOARD.splice(50);
    }

    return NextResponse.json({
      success: true,
      message: 'Game result submitted successfully',
      entry: leaderboardEntry,
      rank: calculateRank(finalScore)
    });

  } catch (error) {
    console.error('❌ Submit game result error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to submit game result' 
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate rank (mock implementation)
function calculateRank(score: number): number {
  const betterScores = MOCK_LEADERBOARD.filter(entry => entry.score > score);
  return betterScores.length + 1;
}
