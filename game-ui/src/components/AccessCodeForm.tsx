'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Key, Mail, User, Building, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useGameStore } from '@/store/gameStore';
import toast from 'react-hot-toast';

interface AccessCodeFormProps {
  onSuccess: () => void;
  className?: string;
}

export function AccessCodeForm({ onSuccess, className = '' }: AccessCodeFormProps) {
  const { setSession, setLoading, isLoading } = useGameStore();
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
      // In real implementation, this would call the leaderboard API
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
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to validate access code');
      }

      const data = await response.json();

      if (data.success) {
        // Create session from API response
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
    } catch (error) {
      console.error('Access code validation error:', error);
      
      // For demo purposes, simulate success
      if (formData.accessCode.toUpperCase() === 'DEMO01') {
        setSession({
          sessionId: 'demo-session-' + Date.now(),
          playerName: formData.playerName,
          playerEmail: formData.playerEmail,
          company: formData.company,
          accessCode: formData.accessCode,
          totalPrice: 0,
          targetPrice: 100,
          completed: false,
        });

        toast.success('Demo mode activated! 🎉');
        onSuccess();
      } else {
        toast.error('Failed to validate access code. Try "DEMO01" for demo mode.');
      }
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
                placeholder="Enter access code (e.g., DEMO01 or ELASTI-XXXX)"
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
            <p className="mt-2 text-xs text-gray-500">
              Demo codes: <code className="bg-gray-100 px-1 rounded">DEMO01</code>, <code className="bg-gray-100 px-1 rounded">TEST01</code>
              <br />Generated codes: <code className="bg-gray-100 px-1 rounded">ELASTI-XXXX</code>
            </p>
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
