-- Update existing users' avatar_url from auth.users metadata
-- This script updates users who don't have an avatar_url set
UPDATE public.users u
SET avatar_url = COALESCE(
  (SELECT raw_user_meta_data->>'avatar_url' FROM auth.users WHERE id = u.id),
  (SELECT raw_user_meta_data->>'picture' FROM auth.users WHERE id = u.id)
)
WHERE u.avatar_url IS NULL OR u.avatar_url = '';

