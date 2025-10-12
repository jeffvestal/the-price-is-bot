'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Play, Pause, RotateCcw } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';

interface GameTimerProps {
  initialTime?: number; // seconds
  onTimeUp?: () => void;
  className?: string;
}

export function GameTimer({ 
  initialTime = 300, // 5 minutes default
  onTimeUp,
  className = ''
}: GameTimerProps) {
  const { 
    timeRemaining, 
    gameStarted, 
    gameEnded, 
    isPlaying,
    setTimeRemaining,
    endGame 
  } = useGameStore();

  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (gameStarted && isPlaying && !gameEnded && !isPaused && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(timeRemaining - 1);
        
        if (timeRemaining <= 1) {
          endGame();
          onTimeUp?.();
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameStarted, isPlaying, gameEnded, isPaused, timeRemaining, setTimeRemaining, endGame, onTimeUp]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeRemaining <= 30) return 'text-red-600';
    if (timeRemaining <= 60) return 'text-yellow-600';
    return 'text-elastic-blue';
  };

  const getProgressColor = () => {
    if (timeRemaining <= 30) return 'bg-red-500';
    if (timeRemaining <= 60) return 'bg-yellow-500';
    return 'bg-elastic-blue';
  };

  const progressPercentage = (timeRemaining / initialTime) * 100;

  if (!gameStarted) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-4 ${className}`}>
        <div className="flex items-center justify-center space-x-3">
          <div className="bg-gray-100 p-2 rounded-full">
            <Clock className="h-5 w-5 text-gray-400" />
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-400">
              {formatTime(initialTime)}
            </div>
            <div className="text-sm text-gray-500">Ready to start</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg border-2 ${
      timeRemaining <= 30 ? 'border-red-200' : 
      timeRemaining <= 60 ? 'border-yellow-200' : 
      'border-elastic-blue/20'
    } ${className}`}>
      <div className="p-4">
        {/* Timer Display */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <motion.div 
              className={`p-2 rounded-full ${
                timeRemaining <= 30 ? 'bg-red-100' :
                timeRemaining <= 60 ? 'bg-yellow-100' :
                'bg-elastic-blue/10'
              }`}
              animate={timeRemaining <= 30 ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 1, repeat: timeRemaining <= 30 ? Infinity : 0 }}
            >
              <Clock className={`h-5 w-5 ${getTimeColor()}`} />
            </motion.div>
            
            <div>
              <motion.div 
                className={`text-3xl font-bold ${getTimeColor()}`}
                animate={timeRemaining <= 10 ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.5, repeat: timeRemaining <= 10 ? Infinity : 0 }}
              >
                {formatTime(timeRemaining)}
              </motion.div>
              <div className="text-sm text-gray-500">
                {gameEnded ? 'Time\'s up!' : isPlaying && !isPaused ? 'Time remaining' : 'Paused'}
              </div>
            </div>
          </div>

          {/* Controls */}
          {!gameEnded && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsPaused(!isPaused)}
                className={`p-2 rounded-full transition-colors ${
                  isPaused 
                    ? 'bg-green-100 hover:bg-green-200 text-green-600' 
                    : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-600'
                }`}
              >
                {isPaused ? (
                  <Play className="h-4 w-4" />
                ) : (
                  <Pause className="h-4 w-4" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Time Progress</span>
            <span className="font-medium">
              {Math.round(((initialTime - timeRemaining) / initialTime) * 100)}% complete
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <motion.div
              className={`h-2 rounded-full transition-all duration-1000 ${getProgressColor()}`}
              initial={{ width: '100%' }}
              animate={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Status Messages */}
        {timeRemaining <= 30 && timeRemaining > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3"
          >
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-700 text-sm font-medium">
                ⚠️ Less than 30 seconds remaining!
              </span>
            </div>
          </motion.div>
        )}

        {timeRemaining <= 60 && timeRemaining > 30 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3"
          >
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              <span className="text-yellow-700 text-sm font-medium">
                🏃‍♂️ One minute remaining - time to finalize!
              </span>
            </div>
          </motion.div>
        )}

        {gameEnded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-3 bg-gradient-to-r from-vegas-gold/10 to-vegas-red/10 border border-vegas-gold/30 rounded-lg p-3"
          >
            <div className="text-center">
              <div className="text-vegas-red font-semibold mb-1">⏰ Time's Up!</div>
              <div className="text-gray-600 text-sm">
                Game completed in {formatTime(initialTime - timeRemaining)}
              </div>
            </div>
          </motion.div>
        )}

        {isPaused && !gameEnded && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3"
          >
            <div className="flex items-center justify-center space-x-2">
              <Pause className="h-4 w-4 text-blue-600" />
              <span className="text-blue-700 text-sm font-medium">
                Game Paused
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
