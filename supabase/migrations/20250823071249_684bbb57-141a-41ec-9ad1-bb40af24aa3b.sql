-- Fix critical security issues: Restrict access to sensitive tables

-- 1. Fix employees table - restrict to admin users only
DROP POLICY IF EXISTS "Enable read access for all users" ON public.employees;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.employees; 
DROP POLICY IF EXISTS "Enable update access for all users" ON public.employees;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.employees;

CREATE POLICY "Admins can view all employees" 
ON public.employees 
FOR SELECT 
USING (public.is_current_user_admin());

CREATE POLICY "Admins can create employees" 
ON public.employees 
FOR INSERT 
WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Admins can update employees" 
ON public.employees 
FOR UPDATE 
USING (public.is_current_user_admin());

CREATE POLICY "Admins can delete employees" 
ON public.employees 
FOR DELETE 
USING (public.is_current_user_admin());

-- 2. Fix profiles table - users can only see their own data, admins can see all
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id OR public.is_current_user_admin());

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.is_current_user_admin());

-- 3. Fix user_sessions table - users can only see their own sessions
DROP POLICY IF EXISTS "Users can view sessions" ON public.user_sessions;

CREATE POLICY "Users can view own sessions" 
ON public.user_sessions 
FOR SELECT 
USING (auth.uid() = user_id OR public.is_current_user_admin());

-- 4. Fix user_audit_logs table - restrict to admins only
DROP POLICY IF EXISTS "Users can view audit logs" ON public.user_audit_logs;

CREATE POLICY "Admins can view all audit logs" 
ON public.user_audit_logs 
FOR SELECT 
USING (public.is_current_user_admin());

-- 5. Also secure departments and user_roles tables to admin access only
DROP POLICY IF EXISTS "Enable read access for all users" ON public.departments;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.departments;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.departments;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.departments;

CREATE POLICY "Admins can manage departments" 
ON public.departments 
FOR ALL 
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_roles;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.user_roles;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.user_roles;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.user_roles;

CREATE POLICY "Admins can manage user roles" 
ON public.user_roles 
FOR ALL 
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());