'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, Agent } from '@/store/gameStore';
import { Button } from '@/components/ui/Button';
import { X, Sparkles, Zap, Target, MapPin, DollarSign } from 'lucide-react';

interface AgentSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAgent: (agent: Agent) => void;
}

const agentIcons = {
  budget_master: DollarSign,
  health_guru: Target,
  gourmet_chef: Sparkles,
  speed_shopper: Zap,
  vegas_local: MapPin,
};

export function AgentSelectorModal({ isOpen, onClose, onSelectAgent }: AgentSelectorModalProps) {
  const { availableAgents } = useGameStore();

  if (!isOpen) return null;

  const handleSelectAgent = (agent: Agent) => {
    onSelectAgent(agent);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-elastic-blue via-elastic-teal to-elastic-green p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-full">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Choose Your Shopping Agent</h2>
                  <p className="text-white/80">Each agent has unique skills to help you win!</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Agent Grid */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableAgents.map((agent, index) => {
                const IconComponent = agentIcons[agent.id as keyof typeof agentIcons] || Sparkles;
                
                return (
                  <motion.div
                    key={agent.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group cursor-pointer"
                    onClick={() => handleSelectAgent(agent)}
                  >
                    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700 hover:border-elastic-blue dark:hover:border-elastic-teal shadow-lg hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
                      {/* Agent Avatar & Name */}
                      <div className="flex items-center space-x-4 mb-4">
                        <div className={`w-16 h-16 ${agent.color} rounded-2xl flex items-center justify-center text-2xl shadow-lg group-hover:shadow-xl transition-shadow`}>
                          <span className="text-white text-2xl">{agent.avatar}</span>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-elastic-blue dark:group-hover:text-elastic-teal transition-colors">
                            {agent.name}
                          </h3>
                          <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                            <IconComponent className="h-4 w-4" />
                            <span className="text-sm">AI Shopping Expert</span>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 leading-relaxed">
                        {agent.description}
                      </p>

                      {/* Personality */}
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 mb-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-2 h-2 bg-elastic-teal rounded-full"></div>
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Personality</span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 italic">"{agent.personality}"</p>
                      </div>

                      {/* Specialties */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-vegas-gold rounded-full"></div>
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Specialties</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {agent.specialties.slice(0, 3).map((specialty, idx) => (
                            <span
                              key={idx}
                              className="inline-block bg-gradient-to-r from-elastic-blue/10 to-elastic-teal/10 dark:from-elastic-blue/20 dark:to-elastic-teal/20 text-elastic-blue dark:text-elastic-teal text-xs px-2 py-1 rounded-full border border-elastic-blue/20 dark:border-elastic-teal/30"
                            >
                              {specialty}
                            </span>
                          ))}
                          {agent.specialties.length > 3 && (
                            <span className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs px-2 py-1 rounded-full">
                              +{agent.specialties.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Select Button */}
                      <div className="mt-6">
                        <Button
                          variant="elastic"
                          className="w-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0"
                          size="sm"
                        >
                          Choose {agent.name}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Info Footer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800"
            >
              <div className="flex items-start space-x-3">
                <div className="bg-purple-100 dark:bg-purple-800 p-2 rounded-full flex-shrink-0">
                  <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Fair Play Guarantee</h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    All agents have equal opportunity to win! Each agent has access to different tools that match their personality, 
                    but the game is designed to ensure fair competition. Choose the agent that best matches your shopping style and strategy.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
