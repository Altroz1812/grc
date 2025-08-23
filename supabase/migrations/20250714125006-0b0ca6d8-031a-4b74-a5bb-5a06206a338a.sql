-- Migration to convert all existing UUIDs to 5-digit sequential IDs (Fixed version)

-- First, let's create a mapping table to store UUID to new ID mappings
CREATE TEMP TABLE id_mappings (
    old_uuid TEXT, -- Store as TEXT to avoid type issues
    new_id TEXT,
    table_name TEXT
);

-- Function to get next sequential ID for any table
CREATE OR REPLACE FUNCTION get_next_sequential_id(table_name text, start_from integer DEFAULT 10001)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    next_id INTEGER;
BEGIN
    -- Get the current max from the mappings or start from the specified number
    SELECT COALESCE(MAX(CAST(new_id AS INTEGER)), start_from - 1) + 1 
    INTO next_id 
    FROM id_mappings 
    WHERE id_mappings.table_name = get_next_sequential_id.table_name;
    
    RETURN next_id;
END;
$$;

-- Disable triggers temporarily to avoid cascading issues
SET session_replication_role = replica;

-- 1. Build mappings for all tables (store UUIDs as text)
INSERT INTO id_mappings (old_uuid, new_id, table_name)
SELECT id::TEXT, get_next_sequential_id('departments')::TEXT, 'departments'
FROM departments
ORDER BY created_at;

INSERT INTO id_mappings (old_uuid, new_id, table_name)
SELECT id::TEXT, get_next_sequential_id('user_roles')::TEXT, 'user_roles'
FROM user_roles
ORDER BY created_at;

INSERT INTO id_mappings (old_uuid, new_id, table_name)
SELECT id::TEXT, get_next_sequential_id('employees')::TEXT, 'employees'
FROM employees
ORDER BY created_at;

INSERT INTO id_mappings (old_uuid, new_id, table_name)
SELECT id::TEXT, get_next_sequential_id('profiles')::TEXT, 'profiles'
FROM profiles
ORDER BY created_at;

INSERT INTO id_mappings (old_uuid, new_id, table_name)
SELECT id::TEXT, get_next_sequential_id('compliances')::TEXT, 'compliances'
FROM compliances
ORDER BY created_at;

INSERT INTO id_mappings (old_uuid, new_id, table_name)
SELECT id::TEXT, get_next_sequential_id('compliance_assignments')::TEXT, 'compliance_assignments'
FROM compliance_assignments
ORDER BY created_at;

INSERT INTO id_mappings (old_uuid, new_id, table_name)
SELECT id::TEXT, get_next_sequential_id('compliance_user_assignments')::TEXT, 'compliance_user_assignments'
FROM compliance_user_assignments
ORDER BY created_at;

INSERT INTO id_mappings (old_uuid, new_id, table_name)
SELECT id::TEXT, get_next_sequential_id('compliance_metrics')::TEXT, 'compliance_metrics'
FROM compliance_metrics
ORDER BY created_at;

INSERT INTO id_mappings (old_uuid, new_id, table_name)
SELECT id::TEXT, get_next_sequential_id('compliance_bulk_uploads')::TEXT, 'compliance_bulk_uploads'
FROM compliance_bulk_uploads
ORDER BY created_at;

INSERT INTO id_mappings (old_uuid, new_id, table_name)
SELECT id::TEXT, get_next_sequential_id('escalation_items')::TEXT, 'escalation_items'
FROM escalation_items
ORDER BY created_at;

INSERT INTO id_mappings (old_uuid, new_id, table_name)
SELECT id::TEXT, get_next_sequential_id('user_audit_logs')::TEXT, 'user_audit_logs'
FROM user_audit_logs
ORDER BY created_at;

INSERT INTO id_mappings (old_uuid, new_id, table_name)
SELECT id::TEXT, get_next_sequential_id('user_sessions')::TEXT, 'user_sessions'
FROM user_sessions
ORDER BY created_at;

-- Now update all the tables with new IDs

-- Update departments
ALTER TABLE departments ALTER COLUMN id TYPE TEXT USING id::TEXT;
UPDATE departments SET id = (SELECT new_id FROM id_mappings WHERE old_uuid = departments.id AND table_name = 'departments');
ALTER TABLE departments ALTER COLUMN id SET DEFAULT generate_sequential_id('departments');

-- Update user_roles  
ALTER TABLE user_roles ALTER COLUMN id TYPE TEXT USING id::TEXT;
UPDATE user_roles SET id = (SELECT new_id FROM id_mappings WHERE old_uuid = user_roles.id AND table_name = 'user_roles');
ALTER TABLE user_roles ALTER COLUMN id SET DEFAULT generate_sequential_id('user_roles');

-- Update employees
ALTER TABLE employees ALTER COLUMN id TYPE TEXT USING id::TEXT;
UPDATE employees SET id = (SELECT new_id FROM id_mappings WHERE old_uuid = employees.id AND table_name = 'employees');
ALTER TABLE employees ALTER COLUMN id SET DEFAULT generate_sequential_id('employees');

-- Update profiles
ALTER TABLE profiles ALTER COLUMN id TYPE TEXT USING id::TEXT;
UPDATE profiles SET id = (SELECT new_id FROM id_mappings WHERE old_uuid = profiles.id AND table_name = 'profiles');

-- Update compliances
ALTER TABLE compliances ALTER COLUMN id TYPE TEXT USING id::TEXT;
UPDATE compliances SET id = (SELECT new_id FROM id_mappings WHERE old_uuid = compliances.id AND table_name = 'compliances');
ALTER TABLE compliances ALTER COLUMN id SET DEFAULT generate_sequential_id('compliances');

-- Update compliance_assignments and foreign keys
ALTER TABLE compliance_assignments ALTER COLUMN id TYPE TEXT USING id::TEXT;
ALTER TABLE compliance_assignments ALTER COLUMN compliance_id TYPE TEXT USING compliance_id::TEXT;
ALTER TABLE compliance_assignments ALTER COLUMN assigned_to TYPE TEXT USING assigned_to::TEXT;
ALTER TABLE compliance_assignments ALTER COLUMN checker_id TYPE TEXT USING checker_id::TEXT;

UPDATE compliance_assignments SET 
    id = (SELECT new_id FROM id_mappings WHERE old_uuid = compliance_assignments.id AND table_name = 'compliance_assignments'),
    compliance_id = (SELECT new_id FROM id_mappings WHERE old_uuid = compliance_assignments.compliance_id AND table_name = 'compliances'),
    assigned_to = (SELECT new_id FROM id_mappings WHERE old_uuid = compliance_assignments.assigned_to AND table_name = 'employees'),
    checker_id = CASE 
        WHEN checker_id IS NOT NULL 
        THEN (SELECT new_id FROM id_mappings WHERE old_uuid = compliance_assignments.checker_id AND table_name = 'employees')
        ELSE NULL 
    END;

ALTER TABLE compliance_assignments ALTER COLUMN id SET DEFAULT generate_sequential_id('compliance_assignments');

-- Update compliance_user_assignments
ALTER TABLE compliance_user_assignments ALTER COLUMN id TYPE TEXT USING id::TEXT;
ALTER TABLE compliance_user_assignments ALTER COLUMN compliance_id TYPE TEXT USING compliance_id::TEXT;
ALTER TABLE compliance_user_assignments ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE compliance_user_assignments ALTER COLUMN assigned_by TYPE TEXT USING assigned_by::TEXT;

UPDATE compliance_user_assignments SET 
    id = (SELECT new_id FROM id_mappings WHERE old_uuid = compliance_user_assignments.id AND table_name = 'compliance_user_assignments'),
    compliance_id = (SELECT new_id FROM id_mappings WHERE old_uuid = compliance_user_assignments.compliance_id AND table_name = 'compliances'),
    user_id = (SELECT new_id FROM id_mappings WHERE old_uuid = compliance_user_assignments.user_id AND table_name = 'employees'),
    assigned_by = CASE 
        WHEN assigned_by IS NOT NULL 
        THEN (SELECT new_id FROM id_mappings WHERE old_uuid = compliance_user_assignments.assigned_by AND table_name = 'profiles')
        ELSE NULL 
    END;

ALTER TABLE compliance_user_assignments ALTER COLUMN id SET DEFAULT generate_sequential_id('compliance_user_assignments');

-- Update compliance_metrics
ALTER TABLE compliance_metrics ALTER COLUMN id TYPE TEXT USING id::TEXT;
UPDATE compliance_metrics SET id = (SELECT new_id FROM id_mappings WHERE old_uuid = compliance_metrics.id AND table_name = 'compliance_metrics');
ALTER TABLE compliance_metrics ALTER COLUMN id SET DEFAULT generate_sequential_id('compliance_metrics');

-- Update compliance_bulk_uploads
ALTER TABLE compliance_bulk_uploads ALTER COLUMN id TYPE TEXT USING id::TEXT;
ALTER TABLE compliance_bulk_uploads ALTER COLUMN uploaded_by TYPE TEXT USING uploaded_by::TEXT;
UPDATE compliance_bulk_uploads SET 
    id = (SELECT new_id FROM id_mappings WHERE old_uuid = compliance_bulk_uploads.id AND table_name = 'compliance_bulk_uploads'),
    uploaded_by = CASE 
        WHEN uploaded_by IS NOT NULL 
        THEN (SELECT new_id FROM id_mappings WHERE old_uuid = compliance_bulk_uploads.uploaded_by AND table_name = 'profiles')
        ELSE NULL 
    END;
ALTER TABLE compliance_bulk_uploads ALTER COLUMN id SET DEFAULT generate_sequential_id('compliance_bulk_uploads');

-- Update escalation_items
ALTER TABLE escalation_items ALTER COLUMN id TYPE TEXT USING id::TEXT;
ALTER TABLE escalation_items ALTER COLUMN compliance_assignment_id TYPE TEXT USING compliance_assignment_id::TEXT;
ALTER TABLE escalation_items ALTER COLUMN escalated_to TYPE TEXT USING escalated_to::TEXT;
UPDATE escalation_items SET 
    id = (SELECT new_id FROM id_mappings WHERE old_uuid = escalation_items.id AND table_name = 'escalation_items'),
    compliance_assignment_id = (SELECT new_id FROM id_mappings WHERE old_uuid = escalation_items.compliance_assignment_id AND table_name = 'compliance_assignments'),
    escalated_to = CASE 
        WHEN escalated_to IS NOT NULL 
        THEN (SELECT new_id FROM id_mappings WHERE old_uuid = escalation_items.escalated_to AND table_name = 'profiles')
        ELSE NULL 
    END;
ALTER TABLE escalation_items ALTER COLUMN id SET DEFAULT generate_sequential_id('escalation_items');

-- Update user_audit_logs
ALTER TABLE user_audit_logs ALTER COLUMN id TYPE TEXT USING id::TEXT;
ALTER TABLE user_audit_logs ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE user_audit_logs ALTER COLUMN performed_by TYPE TEXT USING performed_by::TEXT;
UPDATE user_audit_logs SET 
    id = (SELECT new_id FROM id_mappings WHERE old_uuid = user_audit_logs.id AND table_name = 'user_audit_logs'),
    user_id = CASE 
        WHEN user_id IS NOT NULL 
        THEN (SELECT new_id FROM id_mappings WHERE old_uuid = user_audit_logs.user_id AND table_name = 'profiles')
        ELSE NULL 
    END,
    performed_by = CASE 
        WHEN performed_by IS NOT NULL 
        THEN (SELECT new_id FROM id_mappings WHERE old_uuid = user_audit_logs.performed_by AND table_name = 'profiles')
        ELSE NULL 
    END;
ALTER TABLE user_audit_logs ALTER COLUMN id SET DEFAULT generate_sequential_id('user_audit_logs');

-- Update user_sessions
ALTER TABLE user_sessions ALTER COLUMN id TYPE TEXT USING id::TEXT;
ALTER TABLE user_sessions ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
UPDATE user_sessions SET 
    id = (SELECT new_id FROM id_mappings WHERE old_uuid = user_sessions.id AND table_name = 'user_sessions'),
    user_id = CASE 
        WHEN user_id IS NOT NULL 
        THEN (SELECT new_id FROM id_mappings WHERE old_uuid = user_sessions.user_id AND table_name = 'profiles')
        ELSE NULL 
    END;
ALTER TABLE user_sessions ALTER COLUMN id SET DEFAULT generate_sequential_id('user_sessions');

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Clean up
DROP FUNCTION get_next_sequential_id(text, integer);
DROP TABLE id_mappings;