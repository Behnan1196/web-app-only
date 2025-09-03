'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getAssignedPartner } from '@/lib/assignments';
import { User } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const { user, signOut, loading: authLoading } = useAuth();
  const [assignedPartner, setAssignedPartner] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && !assignedPartner && !loading) {
      // Only load if we don't have a partner and we're not already loading
      loadAssignedPartner();
    } else if (!user && !authLoading) {
      // User is logged out and auth is not loading, redirect to login
      router.push('/');
    }
  }, [user, authLoading, router]);

  const loadAssignedPartner = async () => {
    try {
      console.log('Loading assigned partner for user:', user?.id, user?.role);
      setLoading(true);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout loading assigned partner')), 10000);
      });
      
      const partnerPromise = getAssignedPartner(user!.id, user!.role);
      const partner = await Promise.race([partnerPromise, timeoutPromise]);
      
      console.log('Assigned partner result:', partner);
      setAssignedPartner(partner);
    } catch (error) {
      console.error('Error loading assigned partner:', error);
      setAssignedPartner(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      // Navigation will happen automatically when user becomes null
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleChatPress = () => {
    if (assignedPartner) {
      router.push(`/chat?partner=${encodeURIComponent(JSON.stringify(assignedPartner))}`);
    }
  };

  const handleRefresh = () => {
    setAssignedPartner(null);
    setLoading(true);
    loadAssignedPartner();
  };

  const getPartnerDisplayText = () => {
    if (loading) return 'Loading...';
    if (!assignedPartner) return 'No partner assigned';
    return `Chat with ${assignedPartner.name}`;
  };

  const getPartnerSubtext = () => {
    if (loading) return 'Please wait...';
    if (!assignedPartner) return 'Contact admin for assignment';
    return user?.role === 'coach' ? 'Your assigned student' : 'Your assigned coach';
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Welcome, {user.name} ({user.role})
              </p>
            </div>
            <button
              onClick={handleSignOut}
              disabled={authLoading}
              className={`px-4 py-2 rounded-lg transition-colors ${
                authLoading
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {authLoading ? 'Signing Out...' : 'Sign Out'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Chat Card */}
          <div 
            className={`bg-white rounded-lg shadow-lg p-6 transition-all ${
              !assignedPartner 
                ? 'opacity-50' 
                : 'hover:shadow-xl hover:scale-105'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div 
                className={`flex items-center flex-1 ${
                  assignedPartner ? 'cursor-pointer' : 'cursor-not-allowed'
                }`}
                onClick={assignedPartner ? handleChatPress : undefined}
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Chat</h2>
                  <p className="text-gray-600">{getPartnerDisplayText()}</p>
                </div>
              </div>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-500">{getPartnerSubtext()}</p>
          </div>

          {/* Profile Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl hover:scale-105 transition-all cursor-pointer">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
                <p className="text-gray-600">Manage your account</p>
              </div>
            </div>
            <p className="text-sm text-gray-500">View and update your profile information</p>
          </div>

          {/* Additional Cards for Coaches */}
          {user.role === 'coach' && (
            <>
              <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl hover:scale-105 transition-all cursor-pointer">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Weekly Plans</h2>
                    <p className="text-gray-600">Create study plans</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">Manage weekly study plans for your student</p>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl hover:scale-105 transition-all cursor-pointer">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Progress</h2>
                    <p className="text-gray-600">Track student progress</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">Monitor your student's learning progress</p>
              </div>
            </>
          )}

          {/* Additional Cards for Students */}
          {user.role === 'student' && (
            <>
              <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl hover:scale-105 transition-all cursor-pointer">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Study Time</h2>
                    <p className="text-gray-600">Track your study sessions</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">Monitor your daily study time and progress</p>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl hover:scale-105 transition-all cursor-pointer">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Tasks</h2>
                    <p className="text-gray-600">Complete assigned tasks</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">View and complete tasks from your coach</p>
              </div>
            </>
          )}
        </div>

        {/* Demo Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Demo: Use the same credentials as your mobile app</p>
          <p>Student: ozan@sablon.com / Coach: behnan@sablon.com</p>
        </div>
      </div>
    </div>
  );
}
