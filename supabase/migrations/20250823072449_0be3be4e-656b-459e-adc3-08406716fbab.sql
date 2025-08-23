-- Fix profiles user_role check constraint and user creation issues

-- 1. Drop the existing check constraint that's too restrictive
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_role_check;

-- 2. Add a new check constraint that allows empty strings (for new users)
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_role_check 
CHECK (user_role IN ('maker', 'checker', 'admin', ''));

-- 3. Update the handle_new_user function to properly set user_role from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    email,
    phone,
    user_role,
    department_code,
    role
  )
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'role', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'department_code', ''),
    CASE 
      WHEN NEW.raw_user_meta_data ->> 'role' IN ('maker', 'checker') THEN 'user'
      WHEN NEW.raw_user_meta_data ->> 'role' = 'admin' THEN 'admin'
      ELSE 'user'
    END
  );
  
  INSERT INTO public.user_sessions (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$function$;