'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { streamChatService } from '@/lib/streamChat';
import { User } from '@/types';

interface ChatContextType {
  isConnected: boolean;
  currentChannel: any | null;
  messages: any[];
  isLoading: boolean;
  error: string | null;
  connectToChat: (user: User, partner: User) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  disconnect: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: React.ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [currentChannel, setCurrentChannel] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use refs to track connection state and prevent duplicate connections
  const isConnectingRef = useRef(false);
  const currentChannelRef = useRef<any>(null);

  // Connect to chat with assigned partner
  const connectToChat = useCallback(async (user: User, partner: User) => {
    // Prevent duplicate connections
    if (isConnectingRef.current || isConnected) {
      console.log('Already connecting or connected, skipping...');
      return;
    }

    try {
      isConnectingRef.current = true;
      setIsLoading(true);
      setError(null);

      // Clean up any existing connection first
      if (currentChannelRef.current) {
        await cleanupListeners(currentChannelRef.current);
      }

      // Initialize Stream Chat
      await streamChatService.initialize(user);

      // Determine student and coach IDs
      const studentId = user.role === 'student' ? user.id : partner.id;
      const coachId = user.role === 'coach' ? user.id : partner.id;

      // Get or create chat channel
      const channel = await streamChatService.getOrCreateChannel(studentId, coachId);
      currentChannelRef.current = channel;
      setCurrentChannel(channel);

      // Get existing messages and sort them by creation time (oldest first)
      const existingMessages = await streamChatService.getMessages(channel.id || '');
      const sortedMessages = existingMessages.sort((a: any, b: any) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      setMessages(sortedMessages);

      // Set up real-time message listeners
      setupMessageListeners(channel);

      setIsConnected(true);
      console.log('Chat connected successfully');
    } catch (error) {
      console.error('Error connecting to chat:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect to chat');
    } finally {
      setIsLoading(false);
      isConnectingRef.current = false;
    }
  }, [isConnected]);

  // Clean up event listeners
  const cleanupListeners = useCallback((channel: any) => {
    try {
      if (channel) {
        channel.off('message.new');
        channel.off('message.updated');
        channel.off('message.deleted');
        channel.off('typing.start');
        channel.off('typing.stop');
        console.log('Event listeners cleaned up');
      }
    } catch (error) {
      console.error('Error cleaning up listeners:', error);
    }
  }, []);

  // Set up real-time message listeners
  const setupMessageListeners = useCallback((channel: any) => {
    try {
      // Clean up any existing listeners first
      cleanupListeners(channel);

      // Listen for new messages - add to end of array (newest at bottom)
      channel.on('message.new', (event: any) => {
        console.log('New message received:', event.message);
        setMessages(prev => {
          // Check if message already exists to prevent duplicates
          const messageExists = prev.some(msg => msg.id === event.message.id);
          if (messageExists) {
            console.log('Message already exists, skipping duplicate');
            return prev;
          }
          return [...prev, event.message];
        });
      });

      // Listen for message updates
      channel.on('message.updated', (event: any) => {
        console.log('Message updated:', event.message);
        setMessages(prev => 
          prev.map(msg => msg.id === event.message.id ? event.message : msg)
        );
      });

      // Listen for message deletions
      channel.on('message.deleted', (event: any) => {
        console.log('Message deleted:', event.message);
        setMessages(prev => prev.filter(msg => msg.id !== event.message.id));
      });

      // Listen for typing indicators
      channel.on('typing.start', (event: any) => {
        console.log('User started typing:', event.user?.name);
      });

      channel.on('typing.stop', (event: any) => {
        console.log('User stopped typing:', event.user?.name);
      });

      console.log('Real-time message listeners set up successfully');
    } catch (error) {
      console.error('Error setting up message listeners:', error);
    }
  }, [cleanupListeners]);

  // Send a message
  const sendMessage = useCallback(async (text: string) => {
    if (!currentChannel || !isConnected) {
      setError('Not connected to chat');
      return;
    }

    try {
      setError(null);
      const message = await streamChatService.sendMessage(currentChannel.id || '', text);
      
      // Message will be added via real-time listener
      console.log('Message sent successfully:', message);
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
    }
  }, [currentChannel, isConnected]);

  // Disconnect from chat
  const disconnect = useCallback(async () => {
    try {
      if (currentChannelRef.current) {
        // Remove event listeners
        cleanupListeners(currentChannelRef.current);
      }

      await streamChatService.disconnect();
      setIsConnected(false);
      setCurrentChannel(null);
      currentChannelRef.current = null;
      setMessages([]);
      setError(null);
      isConnectingRef.current = false;
      console.log('Chat disconnected');
    } catch (error) {
      console.error('Error disconnecting from chat:', error);
    }
  }, [cleanupListeners]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Only disconnect when component actually unmounts
      if (isConnected) {
        disconnect();
      }
    };
  }, []); // Remove disconnect from dependencies

  const value: ChatContextType = {
    isConnected,
    currentChannel,
    messages,
    isLoading,
    error,
    connectToChat,
    sendMessage,
    disconnect,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
