-- Add progress tracking fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS starter_pack_shared boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_at timestamp with time zone DEFAULT now();

-- Create index for finding inactive users
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active_at);

-- Add comment for documentation
COMMENT ON COLUMN profiles.starter_pack_shared IS 'Whether user has shared their launch on social media';
COMMENT ON COLUMN profiles.last_active_at IS 'Last time user performed an action in the hub';