-- Create admin user and set up profile
-- First, create the user using admin API simulation
-- Note: This creates the user directly in auth.users and profiles

-- Insert into profiles table (the trigger should handle this, but let's be explicit)
INSERT INTO public.profiles (id, full_name, email, role, status)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Kranthi Samin', 
  'kranthisamin@gmail.com',
  'admin',
  'active'
)
ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  status = 'active',
  updated_at = now();

-- Create a user session record
INSERT INTO public.user_sessions (user_id)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid)
ON CONFLICT (user_id) DO NOTHING;