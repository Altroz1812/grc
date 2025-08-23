-- Update the generate_sequential_id function to generate 5-digit IDs starting from 10001
CREATE OR REPLACE FUNCTION public.generate_sequential_id(table_name text)
RETURNS text
LANGUAGE plpgsql
AS $function$
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
$function$;

-- Update existing tables to use the new ID format
-- Note: This will only affect new records, existing UUIDs will remain

-- Update the default values for tables that use sequential IDs
ALTER TABLE compliance_assignment_rules ALTER COLUMN id SET DEFAULT generate_sequential_id('compliance_assignment_rules');