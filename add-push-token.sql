-- Phase 5: store Expo push tokens on profiles (run in Supabase SQL editor)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS push_token TEXT;

COMMENT ON COLUMN profiles.push_token IS 'Expo push token for mobile notifications';
