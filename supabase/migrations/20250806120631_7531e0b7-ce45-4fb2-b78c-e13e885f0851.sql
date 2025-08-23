-- CRITICAL SECURITY FIXES

-- 1. Enable RLS on compliance_assignment_rules table
ALTER TABLE public.compliance_assignment_rules ENABLE ROW LEVEL SECURITY;

-- 2. Create security definer function to get current user role (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = ''
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 3. Create security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 4. Create RLS policies for compliance_assignment_rules
CREATE POLICY "Admins can view all assignment rules" 
ON public.compliance_assignment_rules 
FOR SELECT 
USING (public.is_current_user_admin());

CREATE POLICY "Admins can create assignment rules" 
ON public.compliance_assignment_rules 
FOR INSERT 
WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Admins can update assignment rules" 
ON public.compliance_assignment_rules 
FOR UPDATE 
USING (public.is_current_user_admin());

CREATE POLICY "Admins can delete assignment rules" 
ON public.compliance_assignment_rules 
FOR DELETE 
USING (public.is_current_user_admin());

-- 5. Fix existing database functions to include proper search paths
CREATE OR REPLACE FUNCTION public.calculate_tat_metrics()
RETURNS TABLE(total_assignments bigint, overdue_count bigint, tat_breaches bigint, avg_days_overdue numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT 
    COUNT(*) as total_assignments,
    COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status != 'approved') as overdue_count,
    COUNT(*) FILTER (WHERE due_date < CURRENT_DATE - INTERVAL '1 day' AND status != 'approved') as tat_breaches,
    COALESCE(AVG(CURRENT_DATE - due_date) FILTER (WHERE due_date < CURRENT_DATE), 0) as avg_days_overdue
  FROM public.compliance_assignments;
$$;

CREATE OR REPLACE FUNCTION public.generate_sequential_id(table_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    next_id INTEGER;
    current_max INTEGER;
BEGIN
    -- Get the current maximum numeric ID for the table, starting from 10001
    EXECUTE format('SELECT COALESCE(MAX(CASE WHEN id ~ ''^[0-9]+$'' THEN CAST(id AS INTEGER) ELSE 0 END), 10000) FROM %I', table_name) INTO current_max;
    
    -- Increment for next ID
    next_id := current_max + 1;
    
    -- Ensure we start from 10001 if no records exist
    IF next_id < 10001 THEN
        next_id := 10001;
    END IF;
    
    RETURN next_id::TEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_compliance_smart(p_compliance_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    compliance_record RECORD;
    available_makers JSON;
    available_checkers JSON;
    assigned_makers JSON;
    assigned_checkers JSON;
BEGIN
    -- Security check: Only allow admin users to call this function
    IF NOT public.is_current_user_admin() THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;

    -- Get compliance details
    SELECT * INTO compliance_record FROM public.compliances WHERE id = p_compliance_id;
    
    -- Find available makers based on department and role
    SELECT JSON_AGG(
        JSON_BUILD_OBJECT(
            'id', p.id,
            'full_name', p.full_name,
            'email', p.email,
            'department_code', p.department_code
        )
    ) INTO available_makers
    FROM public.profiles p
    WHERE p.department_code = compliance_record.department_code
    AND p.user_role = 'maker'
    AND p.status = 'active';
    
    -- Find available checkers based on department and role
    SELECT JSON_AGG(
        JSON_BUILD_OBJECT(
            'id', p.id,
            'full_name', p.full_name,
            'email', p.email,
            'department_code', p.department_code
        )
    ) INTO available_checkers
    FROM public.profiles p
    WHERE p.department_code = compliance_record.department_code
    AND p.user_role = 'checker'
    AND p.status = 'active';
    
    RETURN JSON_BUILD_OBJECT(
        'compliance_id', p_compliance_id,
        'available_makers', COALESCE(available_makers, '[]'::JSON),
        'available_checkers', COALESCE(available_checkers, '[]'::JSON)
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_daily_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.compliance_metrics (
    metric_date,
    total_compliances,
    completed_compliances,
    pending_compliances,
    overdue_compliances,
    tat_breaches
  )
  SELECT 
    CURRENT_DATE,
    (SELECT COUNT(*) FROM public.compliance_assignments),
    (SELECT COUNT(*) FROM public.compliance_assignments WHERE status = 'approved'),
    (SELECT COUNT(*) FROM public.compliance_assignments WHERE status IN ('draft', 'submitted')),
    (SELECT COUNT(*) FROM public.compliance_assignments WHERE due_date < CURRENT_DATE AND status != 'approved'),
    (SELECT COUNT(*) FROM public.compliance_assignments WHERE due_date < CURRENT_DATE - INTERVAL '2 days' AND status != 'approved')
  ON CONFLICT (metric_date) DO UPDATE SET
    total_compliances = EXCLUDED.total_compliances,
    completed_compliances = EXCLUDED.completed_compliances,
    pending_compliances = EXCLUDED.pending_compliances,
    overdue_compliances = EXCLUDED.overdue_compliances,
    tat_breaches = EXCLUDED.tat_breaches,
    updated_at = now();
END;
$$;

-- 6. Add RLS policy to prevent role escalation on profiles table
DROP POLICY IF EXISTS "Users can update profiles" ON public.profiles;

CREATE POLICY "Users can update their own profile (no role changes)" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND 
  -- Prevent role escalation: users cannot change their own role unless they are admin
  (OLD.role = NEW.role OR public.is_current_user_admin())
);

CREATE POLICY "Admins can update any profile" 
ON public.profiles 
FOR UPDATE 
USING (public.is_current_user_admin());

-- 7. Secure user creation - only admins can create users with specific roles
DROP POLICY IF EXISTS "Users can insert profiles" ON public.profiles;

CREATE POLICY "Authenticated users can create basic profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  auth.uid() = id AND 
  (role IS NULL OR role = 'user' OR public.is_current_user_admin())
);

CREATE POLICY "Admins can create any profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (public.is_current_user_admin());