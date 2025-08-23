-- Create admin user profile
-- Insert into profiles table with a proper UUID
INSERT INTO public.profiles (id, full_name, email, role, status)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Kranthi Samin', 
  'kranthisamin@gmail.com',
  'admin',
  'active'
);

-- Create a user session record
INSERT INTO public.user_sessions (user_id)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid);