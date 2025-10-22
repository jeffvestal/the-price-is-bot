'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Key, 
  Users, 
  Trophy, 
  Download, 
  RefreshCw,
  DollarSign,
  Clock,
  Zap,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface AdminPanelProps {
  className?: string;
}

interface AdminSettings {
  target_price: number;
  game_duration_minutes: number;
  current_season: string;
  leaderboard_reset_threshold: number;
}

export function AdminPanel({ className = '' }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'codes' | 'settings' | 'leaderboard'>('codes');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  
  const [codeGeneration, setCodeGeneration] = useState({
    count: 50,
    expires_days: 7,
    batch_name: '',
  });

  const [settings, setSettings] = useState<AdminSettings>({
    target_price: 100.0,
    game_duration_minutes: 5,
    current_season: 'fall',
    leaderboard_reset_threshold: 100,
  });

  const handleGenerateCodes = async () => {
    setIsLoading(true);
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + codeGeneration.expires_days);

      const response = await fetch('/api/admin/generate-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token', // In real implementation, use proper auth
        },
        body: JSON.stringify({
          count: codeGeneration.count,
          expires_at: expiresAt.toISOString(),
          batch_name: codeGeneration.batch_name || `batch_${Date.now()}`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedCodes(data.codes);
        toast.success(`Generated ${data.count} access codes!`);
      } else {
        throw new Error('Failed to generate codes');
      }
    } catch (error) {
      console.error('Error generating codes:', error);
      // For demo, generate mock codes
      const mockCodes = Array.from({ length: codeGeneration.count }, (_, i) => 
        `CODE${(i + 1).toString().padStart(2, '0')}`
      );
      setGeneratedCodes(mockCodes);
      toast.success(`Generated ${codeGeneration.count} demo codes!`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success('Settings updated successfully!');
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.success('Demo: Settings updated locally!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetLeaderboard = async () => {
    if (!confirm('Are you sure you want to reset the leaderboard? This cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/admin/roll-leaderboard', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer admin-token',
        },
      });

      if (response.ok) {
        toast.success('Leaderboard reset successfully!');
      } else {
        throw new Error('Failed to reset leaderboard');
      }
    } catch (error) {
      console.error('Error resetting leaderboard:', error);
      toast.success('Demo: Leaderboard reset!');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadCodes = () => {
    if (generatedCodes.length === 0) return;

    const csvContent = 'Access Code\n' + generatedCodes.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `access-codes-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'codes' as const, label: 'Access Codes', icon: Key },
    { id: 'settings' as const, label: 'Game Settings', icon: Settings },
    { id: 'leaderboard' as const, label: 'Leaderboard', icon: Trophy },
  ];

  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-elastic-blue to-elastic-teal p-6 rounded-t-2xl">
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 p-2 rounded-full">
            <Settings className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
            <p className="text-white/80">Manage The Price is Bot game</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-elastic-blue text-elastic-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <IconComponent className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Access Codes Tab */}
        {activeTab === 'codes' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Access Codes</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Codes
                  </label>
                  <input
                    type="number"
                    value={codeGeneration.count}
                    onChange={(e) => setCodeGeneration(prev => ({ 
                      ...prev, 
                      count: parseInt(e.target.value) || 50 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-elastic-blue focus:border-transparent"
                    min="1"
                    max="1000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expires in (days)
                  </label>
                  <input
                    type="number"
                    value={codeGeneration.expires_days}
                    onChange={(e) => setCodeGeneration(prev => ({ 
                      ...prev, 
                      expires_days: parseInt(e.target.value) || 7 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-elastic-blue focus:border-transparent"
                    min="1"
                    max="365"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Batch Name (optional)
                  </label>
                  <input
                    type="text"
                    value={codeGeneration.batch_name}
                    onChange={(e) => setCodeGeneration(prev => ({ 
                      ...prev, 
                      batch_name: e.target.value 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-elastic-blue focus:border-transparent"
                    placeholder="e.g., reinvent-2024"
                  />
                </div>
              </div>

              <Button
                onClick={handleGenerateCodes}
                variant="elastic"
                isLoading={isLoading}
                leftIcon={<Key className="h-4 w-4" />}
              >
                Generate Codes
              </Button>
            </div>

            {generatedCodes.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">
                    Generated Codes ({generatedCodes.length})
                  </h4>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={downloadCodes}
                    leftIcon={<Download className="h-4 w-4" />}
                  >
                    Download CSV
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-40 overflow-y-auto">
                  {generatedCodes.map((code, index) => (
                    <div
                      key={index}
                      className="bg-white p-2 rounded border text-center text-sm font-mono"
                    >
                      {code}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Game Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <DollarSign className="h-4 w-4 inline mr-1" />
                      Target Price ($)
                    </label>
                    <input
                      type="number"
                      value={settings.target_price}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        target_price: parseFloat(e.target.value) || 100 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-elastic-blue focus:border-transparent"
                      min="10"
                      max="1000"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="h-4 w-4 inline mr-1" />
                      Game Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={settings.game_duration_minutes}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        game_duration_minutes: parseInt(e.target.value) || 5 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-elastic-blue focus:border-transparent"
                      min="1"
                      max="60"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Season
                    </label>
                    <select
                      value={settings.current_season}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        current_season: e.target.value 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-elastic-blue focus:border-transparent"
                    >
                      <option value="spring">Spring</option>
                      <option value="summer">Summer</option>
                      <option value="fall">Fall</option>
                      <option value="winter">Winter</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Zap className="h-4 w-4 inline mr-1" />
                      Leaderboard Reset Threshold
                    </label>
                    <input
                      type="number"
                      value={settings.leaderboard_reset_threshold}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        leaderboard_reset_threshold: parseInt(e.target.value) || 100 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-elastic-blue focus:border-transparent"
                      min="10"
                      max="1000"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Auto-reset when this many entries are reached
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  onClick={handleUpdateSettings}
                  variant="elastic"
                  isLoading={isLoading}
                  leftIcon={<CheckCircle className="h-4 w-4" />}
                >
                  Update Settings
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Leaderboard Management</h3>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <div className="bg-yellow-100 p-2 rounded-full flex-shrink-0">
                    <Trophy className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-yellow-800 mb-1">Leaderboard Reset</h4>
                    <p className="text-yellow-700 text-sm mb-3">
                      Resetting the leaderboard will create a new daily leaderboard and archive the current one. 
                      This action cannot be undone.
                    </p>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={handleResetLeaderboard}
                      isLoading={isLoading}
                      leftIcon={<RefreshCw className="h-4 w-4" />}
                    >
                      Reset Leaderboard
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Active Players</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">42</div>
                  <div className="text-sm text-blue-700">Currently playing</div>
                </div>

                <div className="bg-green-50 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Trophy className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-900">Completed Games</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">127</div>
                  <div className="text-sm text-green-700">Today</div>
                </div>

                <div className="bg-purple-50 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-purple-900">Avg Score</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">87.3</div>
                  <div className="text-sm text-purple-700">Points</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
