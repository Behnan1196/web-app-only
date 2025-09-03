'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationSettings } from '@/components/NotificationSettings';

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    console.log('Settings page - user:', user?.id, 'loading:', loading);
    if (!user && !loading) {
      // User is not logged in and auth is not loading, redirect to login
      console.log('Settings page - redirecting to login');
      router.push('/');
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if user is not logged in (will redirect in useEffect)
  if (!user) {
    return null;
  }

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

