
-- Add bulk upload tracking table
CREATE TABLE public.compliance_bulk_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  uploaded_by UUID REFERENCES public.profiles(id),
  total_records INTEGER DEFAULT 0,
  successful_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  error_log JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Add assignment status tracking
CREATE TABLE public.compliance_user_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  compliance_id UUID REFERENCES public.compliances(id) NOT NULL,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  assigned_by UUID REFERENCES public.profiles(id),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(compliance_id, user_id)
);

-- Enable RLS on new tables
ALTER TABLE public.compliance_bulk_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_user_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for bulk uploads
CREATE POLICY "Users can view bulk uploads" 
  ON public.compliance_bulk_uploads 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create bulk uploads" 
  ON public.compliance_bulk_uploads 
  FOR INSERT 
  WITH CHECK (true);

-- RLS policies for user assignments
CREATE POLICY "Users can view assignments" 
  ON public.compliance_user_assignments 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create assignments" 
  ON public.compliance_user_assignments 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update assignments" 
  ON public.compliance_user_assignments 
  FOR UPDATE 
  USING (true);

-- Add indexes for performance
CREATE INDEX idx_compliance_bulk_uploads_status ON public.compliance_bulk_uploads(status);
CREATE INDEX idx_compliance_user_assignments_status ON public.compliance_user_assignments(status);
CREATE INDEX idx_compliance_user_assignments_compliance ON public.compliance_user_assignments(compliance_id);
