
-- Add missing columns to compliance_assignments table
ALTER TABLE public.compliance_assignments 
ADD COLUMN submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
