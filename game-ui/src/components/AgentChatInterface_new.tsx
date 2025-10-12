'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, MessageCircle, Loader2, ChevronDown, ChevronRight, Settings, Database } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { Button } from '@/components/ui/Button';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  items?: any[];
  steps?: Array<{
    type: string;
    reasoning?: string;
    tool_id?: string;
    params?: any;
    results?: any;
  }>;
}

interface AgentChatInterfaceProps {
  className?: string;
  onSuggestedItemsChange?: (items: any[]) => void;
}

export function AgentChatInterface({ className = '', onSuggestedItemsChange }: AgentChatInterfaceProps) {
  const { selectedAgent, addItem, session, gameStarted, gameEnded } = useGameStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [suggestedItems, setSuggestedItems] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (inputRef.current && gameStarted && !gameEnded) {
      inputRef.current.focus();
    }
  }, [gameStarted, gameEnded]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedAgent || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Clear previous suggested items when sending a new message
    setSuggestedItems([]);
    onSuggestedItemsChange?.([]);

    try {
      const response = await fetch('/api/agent-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage.trim(),
          agentId: selectedAgent.id,
          sessionId: session?.sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiResponse = await response.json();
      console.log('✅ API Response:', apiResponse);

      if (!apiResponse.success) {
        throw new Error(apiResponse.error || 'Agent request failed');
      }

      // Extract steps from the response for display
      const steps = apiResponse.metadata?.steps || [];
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: apiResponse.response,
        timestamp: new Date(),
        items: apiResponse.items || [],
        steps: steps
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Update suggested items
      if (apiResponse.items && apiResponse.items.length > 0) {
        setSuggestedItems(apiResponse.items);
        onSuggestedItemsChange?.(apiResponse.items);
      }

    } catch (error) {
      console.error('❌ Chat error:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!selectedAgent) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center h-96 transition-colors ${className}`}>
        <div className="text-center">
          <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 transition-colors">Select an agent to start chatting!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col transition-colors ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-elastic-blue/5 to-elastic-teal/5 dark:from-elastic-blue/10 dark:to-elastic-teal/10 transition-colors">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 ${selectedAgent.color} rounded-full flex items-center justify-center`}>
            <span className="text-white text-lg">{selectedAgent.avatar}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900 dark:text-white transition-colors">{selectedAgent.name}</h3>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-green-600 dark:text-green-400 font-medium transition-colors">Online</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">{selectedAgent.description}</p>
          </div>
          <div className="bg-elastic-blue/10 dark:bg-elastic-blue/20 p-2 rounded-full transition-colors">
            <MessageCircle className="h-4 w-4 text-elastic-blue" />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                <div className={`rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-elastic-blue text-white ml-auto'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white transition-colors'
                }`}>
                  {message.role === 'assistant' && (
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">{selectedAgent.avatar}</span>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors">
                        {selectedAgent.name}
                      </span>
                    </div>
                  )}
                  
                  {/* Agent Steps Display */}
                  {message.steps && message.steps.length > 0 && (
                    <div className="mb-3 space-y-1">
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center mb-2">
                        <Settings className="h-3 w-3 mr-1" />
                        Agent Steps:
                      </div>
                      {message.steps.map((step: any, idx: number) => {
                        const stepId = `${message.id}-${idx}`;
                        const isExpanded = expandedSteps.has(stepId);
                        
                        return (
                          <div key={idx} className="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                            <button
                              onClick={() => toggleStep(stepId)}
                              className="w-full flex items-center justify-between p-2 hover:bg-green-100 dark:hover:bg-green-800/30 transition-colors"
                            >
                              <div className="flex items-center space-x-2">
                                {step.type === 'reasoning' ? (
                                  <>
                                    <Settings className="h-3 w-3 text-green-600 dark:text-green-400" />
                                    <span className="text-xs font-medium text-green-800 dark:text-green-200">
                                      Reasoning
                                    </span>
                                  </>
                                ) : step.type === 'tool_call' ? (
                                  <>
                                    <Database className="h-3 w-3 text-green-600 dark:text-green-400" />
                                    <span className="text-xs font-medium text-green-800 dark:text-green-200">
                                      {step.tool_id || 'Tool Call'}
                                    </span>
                                    {step.params && Object.keys(step.params).length > 0 && (
                                      <span className="text-xs bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-300 px-2 py-1 rounded-full">
                                        {Object.keys(step.params).length} param{Object.keys(step.params).length !== 1 ? 's' : ''}
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <Settings className="h-3 w-3 text-green-600 dark:text-green-400" />
                                    <span className="text-xs font-medium text-green-800 dark:text-green-200">
                                      {step.type || 'Step'}
                                    </span>
                                  </>
                                )}
                              </div>
                              {isExpanded ? (
                                <ChevronDown className="h-3 w-3 text-green-600 dark:text-green-400" />
                              ) : (
                                <ChevronRight className="h-3 w-3 text-green-600 dark:text-green-400" />
                              )}
                            </button>
                            
                            {isExpanded && (
                              <div className="border-t border-green-200 dark:border-green-700 p-3 bg-green-25 dark:bg-green-900/10">
                                <div className="space-y-3">
                                  {/* Reasoning Section */}
                                  {step.type === 'reasoning' && step.reasoning && (
                                    <div>
                                      <div className="text-xs font-semibold text-green-700 dark:text-green-300 mb-2 uppercase tracking-wide">
                                        Agent Thinking:
                                      </div>
                                      <div className="bg-green-100 dark:bg-green-900/40 rounded-md p-3">
                                        <div className="text-xs text-green-800 dark:text-green-200 leading-relaxed">
                                          {step.reasoning}
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Tool Call Parameters Section */}
                                  {step.type === 'tool_call' && step.params && Object.keys(step.params).length > 0 && (
                                    <div>
                                      <div className="text-xs font-semibold text-green-700 dark:text-green-300 mb-2 uppercase tracking-wide">
                                        Parameters:
                                      </div>
                                      <div className="bg-green-100 dark:bg-green-900/40 rounded-md p-3">
                                        <pre className="text-xs text-green-800 dark:text-green-200 whitespace-pre-wrap font-mono">
                                          {JSON.stringify(step.params, null, 2)}
                                        </pre>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Tool Call Results Section */}
                                  {step.type === 'tool_call' && step.results && step.results.length > 0 && (
                                    <div>
                                      <div className="text-xs font-semibold text-green-700 dark:text-green-300 mb-2 uppercase tracking-wide">
                                        Results:
                                      </div>
                                      {step.results.map((result: any, resultIdx: number) => (
                                        <div key={resultIdx} className="bg-green-100 dark:bg-green-900/40 rounded-md p-3 mb-2">
                                          {result.type === 'query' && result.data?.esql ? (
                                            // Format ES|QL query cleanly
                                            <div>
                                              <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-2">ES|QL Query:</div>
                                              <div className="bg-gray-900 dark:bg-gray-800 rounded-md p-4 border border-gray-300 dark:border-gray-600">
                                                <pre className="text-xs text-gray-100 font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">
                                                  {result.data.esql
                                                    // Only add line breaks for major SQL clauses
                                                    .replace(/\s*\|\s*WHERE\s+/g, '\n| WHERE ')
                                                    .replace(/\s*\|\s*EVAL\s+/g, '\n| EVAL ')
                                                    .replace(/\s*\|\s*STATS\s+/g, '\n| STATS ')
                                                    .replace(/\s*\|\s*SORT\s+/g, '\n| SORT ')
                                                    .replace(/\s*\|\s*LIMIT\s+/g, '\n| LIMIT ')
                                                    .replace(/\s*\|\s*LOOKUP\s+/g, '\n| LOOKUP ')
                                                    .replace(/\s+BY\s+/g, '\n  BY ')
                                                    .trim()
                                                  }
                                                </pre>
                                              </div>
                                            </div>
                                          ) : result.type === 'tabular_data' && result.data ? (
                                            // Format tabular data nicely
                                            <div>
                                              <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-2">
                                                Found {result.data.values?.length || 0} results
                                              </div>
                                              {result.data.values && result.data.values.length > 0 && (
                                                <div className="max-h-32 overflow-y-auto">
                                                  <div className="text-xs text-green-700 dark:text-green-300 font-mono">
                                                    {/* Show column headers if available */}
                                                    {result.data.columns && (
                                                      <div className="grid grid-cols-3 gap-2 pb-2 border-b border-green-300 dark:border-green-600 font-semibold">
                                                        <span>Name</span>
                                                        <span>Price</span>
                                                        <span>Brand</span>
                                                      </div>
                                                    )}
                                                    {result.data.values.slice(0, 5).map((row: any[], rowIdx: number) => (
                                                      <div key={rowIdx} className="py-1 border-b border-green-200 dark:border-green-700 last:border-b-0">
                                                        {Array.isArray(row) ? (
                                                          <div className="grid grid-cols-3 gap-2">
                                                            <span className="truncate" title={row[5] || 'N/A'}>
                                                              {row[5] || 'N/A'}
                                                            </span>
                                                            <span className="truncate font-medium">
                                                              ${row[0]?.toFixed?.(2) || 'N/A'}
                                                            </span>
                                                            <span className="truncate text-green-600 dark:text-green-400" title={row[6] || 'N/A'}>
                                                              {row[6] || 'N/A'}
                                                            </span>
                                                          </div>
                                                        ) : (
                                                          <span className="text-gray-500">{JSON.stringify(row)}</span>
                                                        )}
                                                      </div>
                                                    ))}
                                                    {result.data.values.length > 5 && (
                                                      <div className="text-center py-2 text-green-500 dark:text-green-400 text-xs">
                                                        ... and {result.data.values.length - 5} more items
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          ) : (
                                            // Fallback for other result types
                                            <div>
                                              <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-2">
                                                {result.type || 'Result'}:
                                              </div>
                                              <pre className="text-xs text-green-800 dark:text-green-200 whitespace-pre-wrap font-mono max-h-32 overflow-y-auto">
                                                {JSON.stringify(result, null, 2)}
                                              </pre>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Show the message content properly */}
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.role === 'assistant' && message.items && message.items.length > 0 ? (
                      // If there are suggested items, show a simple message
                      `${selectedAgent.name} found some great options for you! Use the "Add" buttons below to add items to your cart.`
                    ) : (
                      // Otherwise show the full message content
                      message.content
                    )}
                  </div>
                  
                  <div className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>

              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'user' 
                  ? 'bg-elastic-blue ml-2 order-1' 
                  : 'bg-gray-200 mr-2 order-2'
              }`}>
                {message.role === 'user' ? (
                  <User className="h-4 w-4 text-white" />
                ) : (
                  <span className="text-sm">{selectedAgent.avatar}</span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="max-w-[80%] order-1">
              <div className="rounded-2xl px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white transition-colors">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-elastic-blue" />
                  <span className="text-sm">Agent is thinking...</span>
                </div>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-200 ml-2 order-2">
              <span className="text-sm">{selectedAgent?.avatar}</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 transition-colors">
        {gameEnded ? (
          <div className="text-center py-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 transition-colors">Game Over!</div>
            <div className="text-xs text-gray-400 dark:text-gray-500 transition-colors">
              Chat is now disabled. Thanks for playing!
            </div>
          </div>
        ) : !gameStarted ? (
          <div className="text-center py-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 transition-colors">Ready to start shopping?</div>
            <div className="text-xs text-gray-400 dark:text-gray-500 transition-colors">
              Start the game to begin chatting with your agent!
            </div>
          </div>
        ) : (
          <div className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Ask ${selectedAgent.name} for help...`}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-elastic-blue focus:border-transparent resize-none transition-colors"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              variant="elastic"
              size="md"
              className="px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
