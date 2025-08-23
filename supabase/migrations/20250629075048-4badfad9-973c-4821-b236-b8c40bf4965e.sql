
-- First, let's create a function to generate sequential IDs
CREATE OR REPLACE FUNCTION generate_sequential_id(table_name TEXT)
RETURNS TEXT AS $$
DECLARE
    next_id INTEGER;
    formatted_id TEXT;
BEGIN
    -- Get the next sequence number for the table
    EXECUTE format('SELECT COALESCE(MAX(CAST(SUBSTRING(id FROM ''^[A-Z]+(\d+)$'') AS INTEGER)), 0) + 1 FROM %I', table_name) INTO next_id;
    
    -- Format the ID based on table name
    CASE table_name
        WHEN 'compliances' THEN formatted_id := 'COMP' || LPAD(next_id::TEXT, 6, '0');
        WHEN 'compliance_assignments' THEN formatted_id := 'ASGN' || LPAD(next_id::TEXT, 6, '0');
        WHEN 'profiles' THEN formatted_id := 'USER' || LPAD(next_id::TEXT, 6, '0');
        WHEN 'departments' THEN formatted_id := 'DEPT' || LPAD(next_id::TEXT, 6, '0');
        WHEN 'employees' THEN formatted_id := 'EMP' || LPAD(next_id::TEXT, 6, '0');
        ELSE formatted_id := 'ID' || LPAD(next_id::TEXT, 6, '0');
    END CASE;
    
    RETURN formatted_id;
END;
$$ LANGUAGE plpgsql;

-- Add role column to profiles table for maker/checker designation
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department_code TEXT REFERENCES departments(code);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_role TEXT CHECK (user_role IN ('maker', 'checker', 'admin')) DEFAULT 'maker';

-- Create a table for smart assignment rules
CREATE TABLE IF NOT EXISTS compliance_assignment_rules (
    id TEXT PRIMARY KEY DEFAULT generate_sequential_id('compliance_assignment_rules'),
    department_code TEXT REFERENCES departments(code),
    compliance_type TEXT,
    risk_type TEXT,
    frequency TEXT,
    preferred_maker_count INTEGER DEFAULT 1,
    preferred_checker_count INTEGER DEFAULT 1,
    auto_assign BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function for smart assignment
CREATE OR REPLACE FUNCTION assign_compliance_smart(p_compliance_id UUID)
RETURNS JSON AS $$
DECLARE
    compliance_record RECORD;
    available_makers JSON;
    available_checkers JSON;
    assigned_makers JSON;
    assigned_checkers JSON;
BEGIN
    -- Get compliance details
    SELECT * INTO compliance_record FROM compliances WHERE id = p_compliance_id;
    
    -- Find available makers based on department and role
    SELECT JSON_AGG(
        JSON_BUILD_OBJECT(
            'id', p.id,
            'full_name', p.full_name,
            'email', p.email,
            'department_code', p.department_code
        )
    ) INTO available_makers
    FROM profiles p
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
    FROM profiles p
    WHERE p.department_code = compliance_record.department_code
    AND p.user_role = 'checker'
    AND p.status = 'active';
    
    RETURN JSON_BUILD_OBJECT(
        'compliance_id', p_compliance_id,
        'available_makers', COALESCE(available_makers, '[]'::JSON),
        'available_checkers', COALESCE(available_checkers, '[]'::JSON)
    );
END;
$$ LANGUAGE plpgsql;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_department_role ON profiles(department_code, user_role);
CREATE INDEX IF NOT EXISTS idx_compliance_assignments_status ON compliance_assignments(status);
CREATE INDEX IF NOT EXISTS idx_compliance_assignments_assigned ON compliance_assignments(assigned_to, checker_id);
