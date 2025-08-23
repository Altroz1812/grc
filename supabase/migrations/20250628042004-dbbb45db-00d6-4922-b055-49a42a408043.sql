
-- Create profiles table to store additional user information
CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  phone text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  PRIMARY KEY (id)
);

-- Create user audit logs table
CREATE TABLE public.user_audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  details jsonb,
  ip_address inet,
  user_agent text,
  performed_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user sessions table for tracking login attempts and locks
CREATE TABLE public.user_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  login_attempts integer NOT NULL DEFAULT 0,
  locked_until timestamp with time zone,
  last_login_attempt timestamp with time zone,
  last_successful_login timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update profiles" ON public.profiles FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete profiles" ON public.profiles FOR DELETE TO authenticated USING (true);

-- Create RLS policies for user_audit_logs
CREATE POLICY "Users can view audit logs" ON public.user_audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert audit logs" ON public.user_audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Create RLS policies for user_sessions
CREATE POLICY "Users can view sessions" ON public.user_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert sessions" ON public.user_sessions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update sessions" ON public.user_sessions FOR UPDATE TO authenticated USING (true);

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email);
  
  INSERT INTO public.user_sessions (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR each ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create function to log user actions
CREATE OR REPLACE FUNCTION public.log_user_action(
  p_user_id uuid,
  p_action text,
  p_details jsonb DEFAULT '{}',
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_performed_by uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_audit_logs (user_id, action, details, ip_address, user_agent, performed_by)
  VALUES (p_user_id, p_action, p_details, p_ip_address, p_user_agent, p_performed_by);
END;
$$;
