'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Key, Mail, User, Building, Send, Gamepad2, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useGameStore } from '@/store/gameStore';
import toast from 'react-hot-toast';

interface AccessCodeFormProps {
  onSuccess: () => void;
  className?: string;
}

type FormMode = 'choose' | 'token' | 'notoken';

export function AccessCodeForm({ onSuccess, className = '' }: AccessCodeFormProps) {
  const { setSession, setLoading, isLoading } = useGameStore();
  const [mode, setMode] = useState<FormMode>('choose');
  const [formData, setFormData] = useState({
    accessCode: '',
    playerName: '',
    playerEmail: '',
    company: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.accessCode.trim()) {
      newErrors.accessCode = 'Access code is required';
    } else if (formData.accessCode.length < 4) {
      newErrors.accessCode = 'Access code must be at least 4 characters';
    }

    if (!formData.playerName.trim()) {
      newErrors.playerName = 'Name is required';
    }

    if (!formData.playerEmail.trim()) {
      newErrors.playerEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.playerEmail)) {
      newErrors.playerEmail = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await fetch('/api/validate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_code: formData.accessCode,
          player_name: formData.playerName,
          player_email: formData.playerEmail,
          company: formData.company || undefined,
        }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        let message = 'Failed to validate access code';
        try {
          const maybe = JSON.parse(text);
          message = maybe.message || message;
        } catch {}
        throw new Error(text && !text.startsWith('{') ? text : message);
      }

      const data = await response.json();

      if (data.success) {
        setSession({
          sessionId: data.session.sessionId,
          playerName: data.session.playerName,
          playerEmail: data.session.playerEmail,
          company: data.session.company,
          accessCode: data.session.accessCode,
          totalPrice: 0,
          targetPrice: data.session.targetPrice,
          completed: false,
        });

        toast.success('Welcome to The Price is Bot! 🎉');
        onSuccess();
      } else {
        toast.error(data.message || 'Invalid access code');
      }
    } catch (error: any) {
      console.error('Access code validation error:', error);
      toast.error(error?.message || 'Failed to validate access code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePlayWithoutToken = () => {
    // Set guest session without validation
    setSession({
      sessionId: `guest-${Date.now()}`,
      playerName: 'Guest Player',
      playerEmail: '',
      company: '',
      accessCode: '',
      totalPrice: 0,
      targetPrice: 100, // Default target price for guest play
      completed: false,
      eligible: false, // Not eligible for leaderboard
    });

    toast.success('Welcome! Playing in guest mode 🎮');
    onSuccess();
  };

  // Show mode selection screen first
  if (mode === 'choose') {
    return (
      <div className={`max-w-md mx-auto ${className}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-vegas-gold via-vegas-red to-purple-600 p-6">
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="w-16 h-16 bg-white/20 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              >
                <Gamepad2 className="h-8 w-8 text-white" />
              </motion.div>
              <h1 className="text-2xl font-bold text-white mb-2">
                The Price is Bot 🤖
              </h1>
              <p className="text-white/90 text-sm">
                Choose how you want to play
              </p>
            </div>
          </div>

          {/* Mode Selection */}
          <div className="p-6 space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Button
                onClick={() => setMode('token')}
                variant="vegas"
                size="lg"
                className="w-full justify-start"
              >
                <Trophy className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">I have a token</div>
                  <div className="text-xs opacity-90">Compete for prizes on the leaderboard</div>
                </div>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                onClick={handlePlayWithoutToken}
                variant="ghost"
                size="lg"
                className="w-full justify-start border-2 border-gray-300 dark:border-gray-600 hover:border-elastic-blue dark:hover:border-elastic-blue"
                disabled={isLoading}
              >
                <Gamepad2 className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">Play without a token</div>
                  <div className="text-xs opacity-70">Just for fun (not eligible for prizes)</div>
                </div>
              </Button>
            </motion.div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <a 
              href="https://www.elastic.co" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-2 text-sm text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
            >
              <img 
                src="/elastic-logo.png" 
                alt="Elastic" 
                className="h-5 w-5"
              />
              <span>Powered by Elastic Agent Builder</span>
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  // Show token form if mode is 'token'
  return (
    <div className={`max-w-md mx-auto ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-vegas-gold via-vegas-red to-purple-600 p-6">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-16 h-16 bg-white/20 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            >
              <Key className="h-8 w-8 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-2">
              The Price is Bot 🤖
            </h1>
            <p className="text-white/90 text-sm">
              Enter your access code to start the challenge!
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Access Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
              Access Code
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={formData.accessCode}
                onChange={(e) => handleInputChange('accessCode', e.target.value.toUpperCase())}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-elastic-blue focus:border-transparent transition-colors ${
                  errors.accessCode ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter access code (e.g., ELASTI-XXXX)"
                maxLength={20}
              />
            </div>
            {errors.accessCode && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-sm text-red-600"
              >
                {errors.accessCode}
              </motion.p>
            )}
          </div>

          {/* Player Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
              Your Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={formData.playerName}
                onChange={(e) => handleInputChange('playerName', e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-elastic-blue focus:border-transparent transition-colors ${
                  errors.playerName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter your name"
              />
            </div>
            {errors.playerName && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-sm text-red-600"
              >
                {errors.playerName}
              </motion.p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                value={formData.playerEmail}
                onChange={(e) => handleInputChange('playerEmail', e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-elastic-blue focus:border-transparent transition-colors ${
                  errors.playerEmail ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="your.email@company.com"
              />
            </div>
            {errors.playerEmail && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-sm text-red-600"
              >
                {errors.playerEmail}
              </motion.p>
            )}
          </div>

          {/* Company (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
              Company <span className="text-gray-400">(optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-elastic-blue focus:border-transparent transition-colors"
                placeholder="Your company name"
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="vegas"
            size="lg"
            className="w-full"
            isLoading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? (
              'Validating...'
            ) : (
              <>
                <Send className="h-5 w-5 mr-2" />
                Start the Challenge
              </>
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <a 
            href="https://www.elastic.co" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-2 text-sm text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
          >
            <img 
              src="/elastic-logo.png" 
              alt="Elastic" 
              className="h-5 w-5"
            />
            <span>Powered by Elastic Agent Builder</span>
          </a>
        </div>
      </motion.div>
    </div>
  );
}
