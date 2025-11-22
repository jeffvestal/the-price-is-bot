'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { AccessCodeForm } from '@/components/AccessCodeForm';
import { AgentSelectorModal } from '@/components/AgentSelectorModal';
import { GameRulesModal } from '@/components/GameRulesModal';
import { AgentChatInterface } from '@/components/AgentChatInterface';
import { ShoppingCart } from '@/components/ShoppingCart';
import { GameTimer } from '@/components/GameTimer';
import { LeaderboardDisplay } from '@/components/LeaderboardDisplay';
import { Button } from '@/components/ui/Button';
import { Toaster } from 'react-hot-toast';
import { 
  Play, 
  RotateCcw, 
  Trophy, 
  Bot, 
  ShoppingBag, 
  Target,
  Sparkles,
  Users,
  HelpCircle,
  Clock,
  Moon,
  Sun
} from 'lucide-react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { toast } from 'react-hot-toast';
import { useTheme } from '@/contexts/ThemeContext';

export default function GameLayout() {
  const {
    isAuthenticated,
    session,
    selectedAgent,
    gameStarted,
    gameEnded,
    isPlaying,
    currentItems,
    timeRemaining,
    showAgentSelector,
    showGameRules,
    setSelectedAgent,
    startGame,
    endGame,
    setTimeRemaining,
    reset,
    showRules,
    hideRules,
    showAgents,
    hideAgents,
    addItem,
  } = useGameStore();

  const [showConfetti, setShowConfetti] = useState(false);
  const [gamePhase, setGamePhase] = useState<'login' | 'setup' | 'playing' | 'complete'>('login');
  const [suggestedItems, setSuggestedItems] = useState<any[]>([]);
  
  // Wrapper to log suggested items
  const setSuggestedItemsWithLogging = (items: any[]) => {
    console.log('🎯 Setting suggested items:', items);
    setSuggestedItems(items);
  };
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const { width, height } = useWindowSize();
  const { theme, toggleTheme } = useTheme();

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (gameStarted && isPlaying && !gameEnded && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(timeRemaining - 1);
        
        if (timeRemaining <= 1) {
          endGame();
          handleGameComplete();
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameStarted, isPlaying, gameEnded, timeRemaining, setTimeRemaining, endGame]);

  // Update game phase based on state
  useEffect(() => {
    if (!isAuthenticated) {
      setGamePhase('login');
      // Clear suggested items when logging out
      setSuggestedItems([]);
    } else if (!gameStarted && !gameEnded) {
      setGamePhase('setup');
    } else if (gameStarted && !gameEnded) {
      setGamePhase('playing');
    } else if (gameEnded) {
      setGamePhase('complete');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  }, [isAuthenticated, gameStarted, gameEnded]);

  // Clear suggested items when session changes (new login with same code)
  useEffect(() => {
    if (session?.sessionId) {
      setSuggestedItems([]);
      setFinalScore(null);
    }
  }, [session?.sessionId]);

  const handlePlayAgain = () => {
    reset();
    setSuggestedItems([]);
    setFinalScore(null);
  };

  const handleStartGame = () => {
    if (!selectedAgent) {
      showAgents();
      return;
    }
    // Clear suggested items when starting a new game
    setSuggestedItems([]);
    setFinalScore(null);
    startGame();
  };

  const handleGameComplete = async () => {
    // Calculate the actual score using the same logic as the backend
    let calculatedScore = 0;
    const uniqueItems = new Set(currentItems.map(item => item.name)).size;
    const timeUsed = 300 - timeRemaining; // Calculate time used
    
    // Rule 1: Must have exactly 5 bags (unique items)
    if (uniqueItems !== 5) {
      console.log(`❌ Score = 0: Wrong number of bags (${uniqueItems}/5)`);
      calculatedScore = 0;
    }
    // Rule 2: Cannot spend over $100.00
    else if (totalPrice > targetPrice) {
      console.log(`❌ Score = 0: Over budget ($${totalPrice}/$${targetPrice})`);
      calculatedScore = 0;
    }
    else {
      // Valid game - calculate score based on proximity to target
      const difference = Math.abs(targetPrice - totalPrice);
      const baseScore = Math.max(0, targetPrice - difference);
      
      // Bonus for being under budget (but not over)
      const underBudgetBonus = totalPrice <= targetPrice ? 5 : 0;
      
      // Time bonus (max 10 points for games under 2 minutes)
      const timeBonus = timeUsed < 120 ? Math.max(0, 10 - (timeUsed / 12)) : 0;
      
      calculatedScore = baseScore + underBudgetBonus + timeBonus;
      console.log(`✅ Valid game: Base=${baseScore}, Budget Bonus=${underBudgetBonus}, Time Bonus=${timeBonus.toFixed(1)}, Final=${calculatedScore.toFixed(1)}`);
    }
    
    // Set the final score for display
    setFinalScore(calculatedScore);
    
    // Submit to leaderboard API
    try {
      const gameResult = {
        sessionId: session?.sessionId,
        playerName: session?.playerName,
        playerEmail: session?.playerEmail,
        company: session?.company,
        totalPrice,
        targetPrice,
        items: currentItems,
        timeUsed,
        agentUsed: selectedAgent?.id
      };
      
      const response = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gameResult),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Score submitted to leaderboard:', result);
      } else {
        console.error('❌ Failed to submit score to leaderboard');
      }
    } catch (error) {
      console.error('❌ Error submitting score:', error);
    }
    
    endGame();
  };

  const totalPrice = currentItems.reduce((sum, item) => sum + (Number(item.price || 0) * item.quantity), 0);
  const targetPrice = session?.targetPrice || 100;

  if (gamePhase === 'login') {
    return (
      <div className="min-h-screen bg-gradient-radial from-elastic-blue/20 via-white to-elastic-teal/20 flex items-center justify-center p-4">
        <div className="w-full max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left side - Welcome */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-center lg:text-left"
            >
              <div className="mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="w-24 h-24 bg-gradient-to-r from-vegas-gold to-vegas-red rounded-3xl mx-auto lg:mx-0 mb-6 flex items-center justify-center shadow-2xl"
                >
                  <ShoppingBag className="h-12 w-12 text-white" />
                </motion.div>
                
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-4">
                  The Price is{' '}
                  <span className="bg-gradient-to-r from-vegas-gold to-vegas-red bg-clip-text text-transparent">
                    Bot 🤖
                  </span>
                </h1>
                
                <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                  Challenge yourself to build the perfect $100 grocery cart using AI-powered shopping agents. 
                  Get as close as possible without going over!
                </p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <Target className="h-5 w-5 text-elastic-blue" />
                      <span className="font-semibold text-gray-900">Goal</span>
                    </div>
                    <p className="text-sm text-gray-600">Reach $100 without going over</p>
                  </div>

                  <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <Bot className="h-5 w-5 text-elastic-teal" />
                      <span className="font-semibold text-gray-900">AI Agents</span>
                    </div>
                    <p className="text-sm text-gray-600">5 unique shopping experts</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-elastic-blue/10 to-elastic-teal/10 rounded-2xl p-6 border border-elastic-blue/20">
                <div className="flex items-center space-x-3 mb-3">
                  <img 
                    src="/elastic-logo.png" 
                    alt="Elastic" 
                    className="h-8 w-8"
                  />
                  <span className="font-semibold text-gray-900">Powered by Elastic Agent Builder</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Experience the future of AI-powered applications with Elasticsearch's Agent Builder platform.
                  Each shopping agent uses real-time data and intelligent reasoning to help you win.
                </p>
              </div>
            </motion.div>

            {/* Right side - Login Form */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <AccessCodeForm onSuccess={() => setGamePhase('setup')} />
            </motion.div>
          </div>
        </div>
        <Toaster position="top-center" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.3}
        />
      )}

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-vegas-gold to-vegas-red rounded-xl flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center space-x-3">
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white transition-colors">The Price is Bot 🤖</h1>
                  {session && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors">Welcome, {session.playerName}!</p>
                  )}
                </div>
                <a 
                  href="https://www.elastic.co" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-gray-50 dark:bg-gray-700 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                >
                  <img 
                    src="/elastic-logo.png" 
                    alt="Elastic" 
                    className="h-5 w-5"
                  />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors">Powered by Elastic</span>
                </a>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                leftIcon={theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              >
                {theme === 'dark' ? 'Light' : 'Dark'}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={showRules}
                leftIcon={<HelpCircle className="h-4 w-4" />}
              >
                Rules
              </Button>

              {gamePhase === 'setup' && (
                <Button
                  variant="elastic"
                  size="sm"
                  onClick={showAgents}
                  leftIcon={<Bot className="h-4 w-4" />}
                >
                  {selectedAgent ? 'Change Agent' : 'Select Agent'}
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={reset}
                leftIcon={<RotateCcw className="h-4 w-4" />}
              >
                Reset
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {/* Setup Phase */}
          {gamePhase === 'setup' && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Welcome Banner */}
              <div className="bg-gradient-to-r from-vegas-gold via-vegas-red to-purple-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Ready to Start Shopping?</h2>
                    <p className="text-white/90">
                      Choose your AI agent and begin building your perfect $100 cart!
                    </p>
                  </div>
                  <div className="bg-white/20 p-4 rounded-xl">
                    <Target className="h-8 w-8" />
                  </div>
                </div>
              </div>

              {/* Agent Selection */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors">
                <div className="text-center mb-6">
                  {selectedAgent ? (
                    <div className="flex items-center justify-center space-x-4 mb-4">
                      <div className={`w-16 h-16 ${selectedAgent.color} rounded-2xl flex items-center justify-center`}>
                        <span className="text-white text-2xl">{selectedAgent.avatar}</span>
                      </div>
                      <div className="text-left">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white transition-colors">{selectedAgent.name}</h3>
                        <p className="text-gray-600 dark:text-gray-300 transition-colors">{selectedAgent.description}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors">
                        <Bot className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">Choose Your Agent</h3>
                      <p className="text-gray-600 dark:text-gray-300 transition-colors">Select an AI shopping expert to help you win!</p>
                    </div>
                  )}

                  <div className="flex justify-center space-x-4">
                    <Button
                      variant="elastic"
                      onClick={showAgents}
                      leftIcon={<Bot className="h-5 w-5" />}
                    >
                      {selectedAgent ? 'Change Agent' : 'Select Agent'}
                    </Button>

                    {selectedAgent && (
                      <Button
                        variant="vegas"
                        onClick={handleStartGame}
                        leftIcon={<Play className="h-5 w-5" />}
                      >
                        Start Game
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Preview Leaderboard */}
              <LeaderboardDisplay limit={5} />
            </motion.div>
          )}

          {/* Playing Phase */}
          {gamePhase === 'playing' && (
            <motion.div
              key="playing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[600px]"
            >
              {/* Left Column - Chat */}
              <div className="lg:col-span-2 flex flex-col space-y-6 min-h-0">
                {/* Game Status Header with Timer */}
                <div className="bg-gradient-to-r from-elastic-blue/10 to-elastic-teal/10 dark:from-elastic-blue/20 dark:to-elastic-teal/20 rounded-xl p-4 border border-elastic-blue/20 dark:border-elastic-blue/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {selectedAgent && (
                        <div className={`w-12 h-12 ${selectedAgent.color} rounded-xl flex items-center justify-center`}>
                          <span className="text-white text-xl">{selectedAgent.avatar}</span>
                        </div>
                      )}
                      <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white transition-colors">
                          Shopping with {selectedAgent?.name}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors">
                          {currentItems.length}/5 bags filled • ${totalPrice.toFixed(2)} of ${targetPrice}
                        </p>
                      </div>
                    </div>
                    
                    {/* Timer Display */}
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-5 w-5 text-elastic-blue" />
                          <span className={`text-2xl font-bold ${
                            timeRemaining <= 60 ? 'text-red-600' : 
                            timeRemaining <= 120 ? 'text-yellow-600' : 
                            'text-elastic-blue'
                          }`}>
                            {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 transition-colors">Time remaining</div>
                      </div>
                    </div>
                  </div>
                </div>

                <AgentChatInterface 
                  className="flex-1" 
                  onSuggestedItemsChange={setSuggestedItemsWithLogging}
                />

                {/* Suggested Items Display - More Compact */}
                {suggestedItems.length > 0 && (
                  <div className="bg-gradient-to-r from-elastic-blue/5 to-elastic-teal/5 dark:from-elastic-blue/10 dark:to-elastic-teal/10 rounded-lg p-3 border border-elastic-blue/20 dark:border-elastic-blue/30 transition-colors">
                    <div className="flex items-center space-x-2 mb-3">
                      <Sparkles className="h-4 w-4 text-elastic-blue" />
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white transition-colors">Agent Suggestions:</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {suggestedItems.map((item, index) => {
                        console.log(`🏷️ Displaying item ${index}:`, { name: item.name, price: item.price, type: typeof item.name });
                        return (
                        <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600 transition-colors">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-gray-900 dark:text-white transition-colors truncate">
                              {item.quantity && item.quantity > 1 ? `${item.quantity}x ` : ''}{item.name}
                            </h4>
                            <p className="text-xs text-elastic-blue font-semibold">${Number(item.price || 0).toFixed(2)}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="elastic"
                            className="ml-2 px-2 py-1 text-xs"
                            onClick={() => {
                              const newItem = {
                                id: `suggested_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${index}`,
                                name: item.name,
                                price: item.price,
                                quantity: item.quantity || 1, // Use agent-suggested quantity
                                store: item.store || 'Agent Suggestion',
                                category: item.category || 'Suggested',
                              };
                              
                              const result = addItem(newItem);
                              
                              if (result.success) {
                                if (result.isNewItem) {
                                  toast.success(`Added ${newItem.quantity}x ${item.name} to your cart!`);
                                } else {
                                  toast.success(`Added ${newItem.quantity} more ${item.name} to your cart!`);
                                }
                              } else {
                                toast.error(result.message);
                              }
                            }}
                          >
                            Add
                          </Button>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Cart */}
              <div className="flex flex-col space-y-6 min-h-0">
                
                <div className="flex-1 min-h-0">
                  <ShoppingCart />
                </div>

                {currentItems.length > 0 && (
                  <div className="sticky bottom-4 z-30 bg-white p-4 rounded-xl shadow-lg border border-gray-200">
                    {/* Validation Status */}
                    {(() => {
                      const uniqueItems = new Set(currentItems.map(item => item.name)).size;
                      const isOverBudget = totalPrice > targetPrice;
                      const isWrongBagCount = uniqueItems !== 5;
                      const hasOverMaxItems = currentItems.some(item => item.quantity > 5);
                      const isInvalid = isOverBudget || isWrongBagCount || hasOverMaxItems;
                      
                      if (isInvalid) {
                        return (
                          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                            <div className="text-xs text-red-600 font-medium mb-1">⚠️ Invalid Game - Score will be 0:</div>
                            <div className="text-xs text-red-500 space-y-1">
                              {isWrongBagCount && <div>• Need exactly 5 bags (currently {uniqueItems})</div>}
                              {isOverBudget && <div>• Over budget: ${totalPrice.toFixed(2)} {'>'} $100.00</div>}
                              {hasOverMaxItems && <div>• Max 5 items per bag (some bags exceed limit)</div>}
                            </div>
                          </div>
                        );
                      } else if (uniqueItems === 5 && totalPrice <= targetPrice) {
                        const difference = Math.abs(targetPrice - totalPrice);
                        const baseScore = Math.max(0, targetPrice - difference);
                        const budgetBonus = 5;
                        const estimatedScore = baseScore + budgetBonus;
                        
                        return (
                          <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                            <div className="text-xs text-green-600 font-medium">✅ Valid Game!</div>
                            <div className="text-xs text-green-500">Estimated Score: ~{estimatedScore.toFixed(1)} points</div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                    
                    <Button
                      variant="vegas"
                      size="lg"
                      onClick={handleGameComplete}
                      className="w-full"
                    >
                      Complete Game & Submit Score
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Complete Phase */}
          {gamePhase === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-8"
            >
              {/* Results Banner */}
              <div className="bg-gradient-to-r from-vegas-gold via-vegas-red to-purple-600 rounded-2xl p-8 text-white text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mb-6"
                >
                  <div className="w-20 h-20 bg-white/20 rounded-3xl mx-auto mb-4 flex items-center justify-center">
                    <Trophy className="h-10 w-10" />
                  </div>
                  <h2 className="text-3xl font-bold mb-2">
                    {finalScore === 0 ? 'Game Complete! 🎯' : 'Game Complete! 🎉'}
                  </h2>
                  <p className="text-white/90 text-lg">
                    You built a ${totalPrice.toFixed(2)} cart with {selectedAgent?.name}!
                  </p>
                  {finalScore === 0 && (
                    <p className="text-yellow-200 text-sm mt-2">
                      {totalPrice > targetPrice 
                        ? `Score is 0 - went over budget by $${(totalPrice - targetPrice).toFixed(2)}` 
                        : `Score is 0 - need exactly 5 bags (currently ${currentItems.length})`}
                    </p>
                  )}
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                    <div className="text-2xl font-bold">${totalPrice.toFixed(2)}</div>
                    <div className="text-white/80 text-sm">Final Total</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                    <div className="text-2xl font-bold">{currentItems.length}</div>
                    <div className="text-white/80 text-sm">Items</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                    <div className="text-2xl font-bold">
                      {finalScore !== null ? finalScore.toFixed(1) : '0.0'}
                    </div>
                    <div className="text-white/80 text-sm">Score</div>
                  </div>
                </div>

                <div className="flex justify-center space-x-4">
                  <Button
                    variant="secondary"
                    onClick={handlePlayAgain}
                    leftIcon={<RotateCcw className="h-5 w-5" />}
                  >
                    Play Again
                  </Button>
                  <Button
                    variant="ghost"
                    leftIcon={<Users className="h-5 w-5" />}
                  >
                    View Leaderboard
                  </Button>
                </div>
              </div>

              {/* Final Cart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ShoppingCart />
                <LeaderboardDisplay />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modals */}
      <AgentSelectorModal
        isOpen={showAgentSelector}
        onClose={hideAgents}
        onSelectAgent={setSelectedAgent}
      />

      <GameRulesModal
        isOpen={showGameRules}
        onClose={hideRules}
      />

      <Toaster position="top-center" />
    </div>
  );
}
