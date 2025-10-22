'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Clock, DollarSign, User, Building, Sparkles } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  playerName: string;
  company?: string;
  agentUsed: string;
  totalPrice: number;
  score: number;
  timeUsed: number;
  completedAt: string;
}

interface LeaderboardDisplayProps {
  className?: string;
  limit?: number;
  showHeader?: boolean;
  autoRefresh?: boolean;
}

const agentEmojis: Record<string, string> = {
  budget_master: '💰',
  health_guru: '🥗',
  gourmet_chef: '👨‍🍳',
  speed_shopper: '⚡',
  vegas_local: '🎰',
};

const agentNames: Record<string, string> = {
  budget_master: 'Budget Master',
  health_guru: 'Health Guru',
  gourmet_chef: 'Gourmet Chef',
  speed_shopper: 'Speed Shopper',
  vegas_local: 'Vegas Local Expert',
};

export function LeaderboardDisplay({ 
  className = '', 
  limit = 10,
  showHeader = true,
  autoRefresh = false
}: LeaderboardDisplayProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      
      // In real implementation, this would call the leaderboard API
      const response = await fetch(`/api/leaderboard?limit=${limit}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          // Transform API data to match our interface
          const transformedData = result.data.map((item: any, index: number) => ({
            rank: index + 1,
            playerName: item.playerName,
            company: item.company,
            agentUsed: item.agentUsed,
            totalPrice: item.totalPrice,
            score: item.score,
            timeUsed: item.timeUsed,
            completedAt: item.completedAt,
          }));
          setEntries(transformedData);
        } else {
          throw new Error('Invalid API response format');
        }
      } else {
        // Mock data for demo
        const mockData: LeaderboardEntry[] = [
          {
            rank: 1,
            playerName: 'Sarah Chen',
            company: 'Acme Corp',
            agentUsed: 'budget_master',
            totalPrice: 99.87,
            score: 98.5,
            timeUsed: 142,
            completedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          },
          {
            rank: 2,
            playerName: 'Mike Rodriguez',
            company: 'TechStart Inc',
            agentUsed: 'health_guru',
            totalPrice: 99.23,
            score: 96.8,
            timeUsed: 189,
            completedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
          },
          {
            rank: 3,
            playerName: 'Emily Johnson',
            company: 'DataFlow Systems',
            agentUsed: 'gourmet_chef',
            totalPrice: 98.45,
            score: 94.2,
            timeUsed: 201,
            completedAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
          },
          {
            rank: 4,
            playerName: 'Alex Kim',
            company: 'Cloud Solutions',
            agentUsed: 'speed_shopper',
            totalPrice: 97.12,
            score: 92.7,
            timeUsed: 95,
            completedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
          },
          {
            rank: 5,
            playerName: 'Jordan Smith',
            agentUsed: 'vegas_local',
            totalPrice: 96.88,
            score: 91.3,
            timeUsed: 234,
            completedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
          },
        ];
        setEntries(mockData);
      }
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    
    if (autoRefresh) {
      const interval = setInterval(fetchLeaderboard, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-sm font-semibold text-gray-600">{rank}</span>
          </div>
        );
    }
  };

  const getRankColors = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 3:
        return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white';
      default:
        return 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 transition-colors ${className}`}>
      {showHeader && (
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-vegas-gold/10 to-vegas-red/10 dark:from-vegas-gold/20 dark:to-vegas-red/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-vegas-gold p-2 rounded-full">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Leaderboard</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Top performers in The Price is Bot challenge
                </p>
              </div>
            </div>
            
            {lastUpdated && (
              <div className="text-right">
                <div className="text-xs text-gray-500 dark:text-gray-400">Last updated</div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {lastUpdated.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4 p-4 bg-gray-100 rounded-xl">
                  <div className="w-8 h-8 bg-gray-300 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 rounded w-1/3 mb-2" />
                    <div className="h-3 bg-gray-300 rounded w-1/4" />
                  </div>
                  <div className="h-6 bg-gray-300 rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-100 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No scores yet</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Be the first to complete the challenge and claim the top spot!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry, index) => (
              <motion.div
                key={`${entry.rank}-${entry.playerName}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative overflow-hidden rounded-xl border-2 ${
                  entry.rank <= 3 ? 'border-transparent' : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className={`p-4 ${getRankColors(entry.rank)}`}>
                  <div className="flex items-center space-x-4">
                    {/* Rank */}
                    <div className="flex-shrink-0">
                      {getRankIcon(entry.rank)}
                    </div>

                    {/* Player Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className={`font-semibold truncate ${
                          entry.rank <= 3 ? 'text-white' : 'text-gray-900 dark:text-white'
                        }`}>
                          {entry.playerName}
                        </h3>
                        
                        {/* Agent Badge */}
                        <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                          entry.rank <= 3 
                            ? 'bg-white/20 text-white' 
                            : 'bg-elastic-blue/10 dark:bg-elastic-blue/20 text-elastic-blue dark:text-elastic-teal'
                        }`}>
                          <span>{agentEmojis[entry.agentUsed] || '🤖'}</span>
                          <span>{agentNames[entry.agentUsed] || 'Agent'}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm">
                        {entry.company && (
                          <div className="flex items-center space-x-1">
                            <Building className={`h-3 w-3 ${
                              entry.rank <= 3 ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
                            }`} />
                            <span className={`truncate ${
                              entry.rank <= 3 ? 'text-white/90' : 'text-gray-600 dark:text-gray-300'
                            }`}>
                              {entry.company}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-1">
                          <Clock className={`h-3 w-3 ${
                            entry.rank <= 3 ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
                          }`} />
                          <span className={`${
                            entry.rank <= 3 ? 'text-white/90' : 'text-gray-600 dark:text-gray-300'
                          }`}>
                            {formatDuration(entry.timeUsed)}
                          </span>
                        </div>
                        
                        <div className={`text-xs ${
                          entry.rank <= 3 ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {getTimeAgo(entry.completedAt)}
                        </div>
                      </div>
                    </div>

                    {/* Score & Price */}
                    <div className="text-right flex-shrink-0">
                      <div className={`text-2xl font-bold ${
                        entry.rank <= 3 ? 'text-white' : 'text-gray-900 dark:text-white'
                      }`}>
                        {entry.score.toFixed(1)}
                      </div>
                      
                      <div className="flex items-center justify-end space-x-1">
                        <DollarSign className={`h-3 w-3 ${
                          entry.rank <= 3 ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
                        }`} />
                        <span className={`text-sm font-medium ${
                          entry.rank <= 3 ? 'text-white/90' : 'text-gray-600 dark:text-gray-300'
                        }`}>
                          {entry.totalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Decorative elements for top 3 */}
                  {entry.rank <= 3 && (
                    <div className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        entry.rank === 1 ? 'bg-yellow-400' : 
                        entry.rank === 2 ? 'bg-gray-400' : 'bg-amber-500'
                      }`}>
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 rounded-b-2xl">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Live leaderboard</span>
          </div>
          
          <a 
            href="https://www.elastic.co" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center space-x-1 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <span>Powered by</span>
            <img 
              src="/elastic-logo.png" 
              alt="Elastic" 
              className="h-4 w-4"
            />
          </a>
        </div>
      </div>
    </div>
  );
}
