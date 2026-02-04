-- Add user_id column to chat_messages for tracking who sent messages
ALTER TABLE chat_messages 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
