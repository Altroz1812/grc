
-- Add the role column to the profiles table first
ALTER TABLE public.profiles ADD COLUMN role text DEFAULT 'user';

-- Then update the admin user's role
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'kranthisamin@gmail.com';
