'use client';

import { AdminPanel } from '@/components/AdminPanel';

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Manage The Price is Bot game settings, access codes, and leaderboard
          </p>
        </div>
        
        <AdminPanel />
      </div>
    </div>
  );
}
