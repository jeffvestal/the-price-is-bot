'use client';

import { motion } from 'framer-motion';
import { ShoppingCart, Target, Clock, Trophy, Sparkles } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { Button } from '@/components/ui/Button';

interface GameRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GameRulesModal({ isOpen, onClose }: GameRulesModalProps) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          {/* Header */}
          <div className="bg-gradient-to-r from-vegas-gold via-vegas-red to-purple-600 p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-full">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">
                  The Price is Bot 🤖 Challenge
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Mission */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-r from-elastic-blue/10 to-elastic-teal/10 rounded-xl p-6 border border-elastic-blue/20"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-elastic-blue p-2 rounded-full">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Your Mission</h3>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed">
                Use your chosen AI shopping agent to fill exactly
                <span className="font-bold text-vegas-red mx-1">5 bags</span>
                with grocery items. Get as close to 
                <span className="font-bold text-vegas-gold mx-1">$100</span> 
                as possible without going over!
              </p>
              <div className="mt-4 p-4 bg-white/50 rounded-lg border border-vegas-gold/30">
                <h4 className="font-semibold text-gray-900 mb-2">🛒 The 5-Bag Rule:</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Exactly <strong>5 unique items</strong> (5 different bags)</li>
                  <li>• Each bag can have <strong>multiple quantities</strong> of the same item</li>
                  <li>• Example: 3 apples, 2 steaks, 1 bread, 4 yogurts, 6 eggs = 5 bags ✅</li>
                </ul>
              </div>
            </motion.div>

            {/* How It Works */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <Sparkles className="h-5 w-5 text-vegas-gold mr-2" />
                How It Works
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-6 h-6 bg-elastic-blue text-white rounded-full flex items-center justify-center text-sm font-semibold">1</div>
                    <span className="font-semibold">Choose Your Agent</span>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Select an AI shopping expert with unique skills and personality
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-6 h-6 bg-elastic-teal text-white rounded-full flex items-center justify-center text-sm font-semibold">2</div>
                    <span className="font-semibold">Chat & Shop</span>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Describe what you want and let your agent find the best items
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-6 h-6 bg-elastic-green text-white rounded-full flex items-center justify-center text-sm font-semibold">3</div>
                    <span className="font-semibold">Fill 5 Bags</span>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Add exactly 5 unique items to reach $100 - strategic choices win!
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-6 h-6 bg-vegas-gold text-white rounded-full flex items-center justify-center text-sm font-semibold">4</div>
                    <span className="font-semibold">Submit & Win</span>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Submit your cart and compete for the top of the leaderboard!
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Scoring */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-r from-vegas-gold/10 to-vegas-red/10 rounded-xl p-6 border border-vegas-gold/30"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-vegas-gold p-2 rounded-full">
                  <Trophy className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Scoring System</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Price Accuracy (up to 100 points)</span>
                  <span className="text-sm text-gray-500">Closer to $100 = Higher score</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Budget Bonus (+5 points)</span>
                  <span className="text-sm text-gray-500">Stay under $100</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Speed Bonus (up to +10 points)</span>
                  <span className="text-sm text-gray-500">Finish under 2 minutes</span>
                </div>
                <div className="border-t pt-3 space-y-2">
                  <div className="font-semibold text-gray-900 mb-2">⚠️ Instant Score = 0 if:</div>
                  <div className="text-sm space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-red-600">• Not exactly 5 bags</span>
                      <span className="text-xs text-gray-500">(too many or too few items)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-red-600">• Over $100.00</span>
                      <span className="text-xs text-gray-500">(even $100.01 = 0 points)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-red-600">• Multiple item types per bag</span>
                      <span className="text-xs text-gray-500">(each bag = 1 item type only)</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Tips */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-3">💡 Pro Tips</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start space-x-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>Each agent has unique specialties - choose wisely based on your strategy!</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>Be specific in your requests - your agent can find exactly what you need</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>Watch the timer - speed bonuses can make the difference!</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>$99.99 beats $90.00 every time - get as close as possible!</span>
                </li>
              </ul>
            </motion.div>

            {/* Powered by */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-center py-4 border-t border-gray-200"
            >
              <p className="text-gray-600 text-sm mb-2">Powered by</p>
              <a 
                href="https://www.elastic.co" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer"
              >
                <img 
                  src="/elastic-logo.png" 
                  alt="Elastic" 
                  className="h-6 w-6"
                />
                <span className="font-semibold text-elastic-blue hover:text-elastic-blue/80">Elastic Agent Builder</span>
              </a>
            </motion.div>

            {/* Action Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex justify-center pt-4"
            >
              <Button
                onClick={onClose}
                className="bg-gradient-to-r from-vegas-gold to-vegas-red hover:from-vegas-red hover:to-purple-600 text-white px-8 py-3 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                Let's Play! 🚀
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
