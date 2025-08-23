-- Migration to convert all existing UUIDs to 5-digit sequential IDs
-- Phase 1: Drop all foreign key constraints

-- Drop foreign key constraints
ALTER TABLE compliance_assignments DROP CONSTRAINT IF EXISTS compliance_assignments_assigned_to_fkey;
ALTER TABLE compliance_assignments DROP CONSTRAINT IF EXISTS compliance_assignments_checker_id_fkey;
ALTER TABLE compliance_assignments DROP CONSTRAINT IF EXISTS compliance_assignments_compliance_id_fkey;
ALTER TABLE compliance_user_assignments DROP CONSTRAINT IF EXISTS compliance_user_assignments_assigned_by_fkey;
ALTER TABLE compliance_user_assignments DROP CONSTRAINT IF EXISTS compliance_user_assignments_compliance_id_fkey;
ALTER TABLE compliance_user_assignments DROP CONSTRAINT IF EXISTS compliance_user_assignments_user_id_fkey;
ALTER TABLE compliance_bulk_uploads DROP CONSTRAINT IF EXISTS compliance_bulk_uploads_uploaded_by_fkey;
ALTER TABLE escalation_items DROP CONSTRAINT IF EXISTS escalation_items_compliance_assignment_id_fkey;
ALTER TABLE escalation_items DROP CONSTRAINT IF EXISTS escalation_items_escalated_to_fkey;
ALTER TABLE compliance_assignment_rules DROP CONSTRAINT IF EXISTS compliance_assignment_rules_department_code_fkey;
ALTER TABLE compliance_metrics DROP CONSTRAINT IF EXISTS compliance_metrics_department_code_fkey;
ALTER TABLE compliances DROP CONSTRAINT IF EXISTS compliances_department_code_fkey;
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_department_code_fkey;
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_role_name_fkey;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_department_code_fkey;

-- Create mapping table
CREATE TEMP TABLE id_mappings (
    old_uuid TEXT,
    new_id TEXT,
    table_name TEXT
);

-- Function to get next sequential ID
CREATE OR REPLACE FUNCTION get_next_sequential_id(table_name text, start_from integer DEFAULT 10001)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    next_id INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(new_id AS INTEGER)), start_from - 1) + 1 
    INTO next_id 
    FROM id_mappings 
    WHERE id_mappings.table_name = get_next_sequential_id.table_name;
    
    RETURN next_id;
END;
$$;

-- Build mappings for all tables
INSERT INTO id_mappings (old_uuid, new_id, table_name)
SELECT id::TEXT, get_next_sequential_id('departments')::TEXT, 'departments'
FROM departments ORDER BY created_at;

INSERT INTO id_mappings (old_uuid, new_id, table_name)
SELECT id::TEXT, get_next_sequential_id('user_roles')::TEXT, 'user_roles'
FROM user_roles ORDER BY created_at;

INSERT INTO id_mappings (old_uuid, new_id, table_name)
SELECT id::TEXT, get_next_sequential_id('employees')::TEXT, 'employees'
FROM employees ORDER BY created_at;

INSERT INTO id_mappings (old_uuid, new_id, table_name)
SELECT id::TEXT, get_next_sequential_id('profiles')::TEXT, 'profiles'
FROM profiles ORDER BY created_at;

INSERT INTO id_mappings (old_uuid, new_id, table_name)
SELECT id::TEXT, get_next_sequential_id('compliances')::TEXT, 'compliances'
FROM compliances ORDER BY created_at;

INSERT INTO id_mappings (old_uuid, new_id, table_name)
SELECT id::TEXT, get_next_sequential_id('compliance_assignments')::TEXT, 'compliance_assignments'
FROM compliance_assignments ORDER BY created_at;

INSERT INTO id_mappings (old_uuid, new_id, table_name)
SELECT id::TEXT, get_next_sequential_id('compliance_user_assignments')::TEXT, 'compliance_user_assignments'
FROM compliance_user_assignments ORDER BY created_at;

INSERT INTO id_mappings (old_uuid, new_id, table_name)
SELECT id::TEXT, get_next_sequential_id('compliance_metrics')::TEXT, 'compliance_metrics'
FROM compliance_metrics ORDER BY created_at;

INSERT INTO id_mappings (old_uuid, new_id, table_name)
SELECT id::TEXT, get_next_sequential_id('compliance_bulk_uploads')::TEXT, 'compliance_bulk_uploads'
FROM compliance_bulk_uploads ORDER BY created_at;

INSERT INTO id_mappings (old_uuid, new_id, table_name)
SELECT id::TEXT, get_next_sequential_id('escalation_items')::TEXT, 'escalation_items'
FROM escalation_items ORDER BY created_at;

INSERT INTO id_mappings (old_uuid, new_id, table_name)
SELECT id::TEXT, get_next_sequential_id('user_audit_logs')::TEXT, 'user_audit_logs'
FROM user_audit_logs ORDER BY created_at;

INSERT INTO id_mappings (old_uuid, new_id, table_name)
SELECT id::TEXT, get_next_sequential_id('user_sessions')::TEXT, 'user_sessions'
FROM user_sessions ORDER BY created_at;

-- Update all tables with new IDs
-- Start with independent tables first

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

-- Clean up temp function and table
DROP FUNCTION get_next_sequential_id(text, integer);
DROP TABLE id_mappings;