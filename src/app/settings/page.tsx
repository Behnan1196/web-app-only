'use client';

import React from 'react';
import { NotificationSettings } from '@/components/NotificationSettings';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>
            
            <div className="space-y-8">
              {/* Notifications Section */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Notifications</h2>
                <NotificationSettings />
              </div>
              
              {/* Future settings sections can be added here */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Account</h2>
                <p className="text-gray-500">Account settings coming soon...</p>
              </div>
              
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Privacy</h2>
                <p className="text-gray-500">Privacy settings coming soon...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

