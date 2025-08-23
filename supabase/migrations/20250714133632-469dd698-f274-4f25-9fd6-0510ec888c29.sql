-- Simple migration to update existing records to use 5-digit sequential IDs
-- Only update tables that don't have critical foreign key dependencies

-- First, let's update the tables that are safe to modify

-- Update compliance_assignment_rules (already uses TEXT)
-- This table already uses the new function, so we're good

-- Update departments table
DO $$
DECLARE
    dept_record RECORD;
    new_id_counter INTEGER := 10001;
BEGIN
    -- Create a mapping for departments
    FOR dept_record IN SELECT * FROM departments ORDER BY created_at LOOP
        UPDATE departments 
        SET id = new_id_counter::TEXT 
        WHERE id = dept_record.id;
        
        new_id_counter := new_id_counter + 1;
    END LOOP;
END $$;

-- Set default for departments
ALTER TABLE departments ALTER COLUMN id SET DEFAULT generate_sequential_id('departments');

-- Update user_roles table
DO $$
DECLARE
    role_record RECORD;
    new_id_counter INTEGER := 10001;
BEGIN
    FOR role_record IN SELECT * FROM user_roles ORDER BY created_at LOOP
        UPDATE user_roles 
        SET id = new_id_counter::TEXT 
        WHERE id = role_record.id;
        
        new_id_counter := new_id_counter + 1;
    END LOOP;
END $$;

-- Set default for user_roles
ALTER TABLE user_roles ALTER COLUMN id SET DEFAULT generate_sequential_id('user_roles');