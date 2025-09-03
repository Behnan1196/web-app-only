'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { useNotifications } from '@/hooks/useNotifications';
import { User } from '@/types';

function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { 
    isConnected, 
    messages, 
    isLoading, 
    error, 
    connectToChat, 
    sendMessage 
  } = useChat();
  const { setChatActivity } = useNotifications();
  
  const [messageText, setMessageText] = useState('');
  const [partner, setPartner] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Parse partner from URL params
  useEffect(() => {
    const partnerParam = searchParams.get('partner');
    if (partnerParam) {
      try {
        const partnerData = JSON.parse(decodeURIComponent(partnerParam));
        setPartner(partnerData);
      } catch (error) {
        console.error('Error parsing partner data:', error);
        router.push('/dashboard');
      }
    }
  }, [searchParams, router]);

  // Connect to chat when component mounts
  useEffect(() => {
    if (user && partner && !isConnected) {
      connectToChat(user, partner);
    }
  }, [user, partner, isConnected, connectToChat]);

  // Track chat activity for notifications
  useEffect(() => {
    // Set user as in chat when component mounts
    setChatActivity(true);
    
    // Set user as not in chat when component unmounts
    return () => {
      setChatActivity(false);
    };
  }, [setChatActivity]);

  // Handle sending message
  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    
    try {
      await sendMessage(messageText.trim());
      setMessageText('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Render individual message
  const renderMessage = (message: any) => {
    const isOwnMessage = message.user?.id === user?.id;
    
    return (
      <div
        key={message.id}
        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div
          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
            isOwnMessage
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800'
          }`}
        >
          <p className="text-sm">{message.text}</p>
          <p className={`text-xs mt-1 ${
            isOwnMessage ? 'text-blue-100' : 'text-gray-500'
          }`}>
            {new Date(message.created_at).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        </div>
      </div>
    );
  };

  if (!user || !partner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="mr-4 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                ← Back to Dashboard
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Connecting to chat...</h1>
                <p className="text-gray-600">Connecting to chat with {partner.name}...</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Establishing connection...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="mr-4 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                ← Back to Dashboard
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Chat Error</h1>
                <p className="text-gray-600">Failed to connect to chat</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-red-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Connection Failed</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => connectToChat(user, partner)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="mr-4 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                ← Back to Dashboard
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Chat with {partner.name}</h1>
                <p className="text-gray-600">
                  {user.role === 'coach' ? 'Your assigned student' : 'Your assigned coach'}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Connected</span>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="h-96 overflow-y-auto mb-4 p-4 border border-gray-200 rounded-lg">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map(renderMessage)}
                {/* Invisible div for auto-scroll */}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="flex space-x-4">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!isConnected}
            />
            <button
              onClick={handleSendMessage}
              disabled={!messageText.trim() || !isConnected}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>
        </div>

        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Chat Status: {isConnected ? 'Connected' : 'Disconnected'}
            </span>
            <span className="text-gray-600">
              Messages: {messages.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}
