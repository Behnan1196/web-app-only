-- Notification System Database Schema
-- Run this in your Supabase SQL editor

-- Drop existing tables and policies for clean start
DROP TABLE IF EXISTS notification_logs CASCADE;
DROP TABLE IF EXISTS notification_tokens CASCADE;
DROP TABLE IF EXISTS user_activity CASCADE;

-- Drop the function if it exists
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Device tokens table (one per platform per user)
CREATE TABLE notification_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('web', 'ios', 'android')),
  token_type TEXT NOT NULL CHECK (token_type IN ('fcm', 'expo', 'apns')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- Notification delivery logs
CREATE TABLE notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'chat_message', 'assignment', etc.
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'delivered', 'failed', 'suppressed')),
  platform TEXT,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User activity tracking for smart filtering
CREATE TABLE user_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_in_chat BOOLEAN DEFAULT false,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  platform TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- Indexes for better performance
CREATE INDEX idx_notification_tokens_user_id ON notification_tokens(user_id);
CREATE INDEX idx_notification_tokens_platform ON notification_tokens(platform);
CREATE INDEX idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX idx_notification_logs_sent_at ON notification_logs(sent_at);
CREATE INDEX idx_user_activity_user_id ON user_activity(user_id);

-- RLS (Row Level Security) policies
ALTER TABLE notification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Users can only access their own notification data
CREATE POLICY "Users can view own notification tokens" ON notification_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification tokens" ON notification_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification tokens" ON notification_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notification logs" ON notification_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own activity" ON user_activity
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own activity" ON user_activity
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity" ON user_activity
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_notification_tokens_updated_at 
  BEFORE UPDATE ON notification_tokens 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_activity_updated_at 
  BEFORE UPDATE ON user_activity 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
