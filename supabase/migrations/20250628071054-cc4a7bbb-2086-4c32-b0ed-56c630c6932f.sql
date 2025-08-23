
-- Create compliance_assignments table for tracking assignments
CREATE TABLE public.compliance_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  compliance_id UUID REFERENCES public.compliances(id) NOT NULL,
  assigned_to UUID REFERENCES public.profiles(id) NOT NULL,
  checker_id UUID REFERENCES public.profiles(id),
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'escalated')),
  maker_remarks TEXT,
  checker_remarks TEXT,
  document_url TEXT,
  escalation_level INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create compliance_metrics table for analytics
CREATE TABLE public.compliance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_compliances INTEGER DEFAULT 0,
  completed_compliances INTEGER DEFAULT 0,
  pending_compliances INTEGER DEFAULT 0,
  overdue_compliances INTEGER DEFAULT 0,
  tat_breaches INTEGER DEFAULT 0,
  sla_compliance_rate DECIMAL(5,2) DEFAULT 0,
  department_code TEXT REFERENCES public.departments(code),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create escalation_items table
CREATE TABLE public.escalation_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  compliance_assignment_id UUID REFERENCES public.compliance_assignments(id) NOT NULL,
  escalation_level INTEGER NOT NULL DEFAULT 1,
  escalated_to UUID REFERENCES public.profiles(id),
  escalated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reason TEXT NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.compliance_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalation_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for compliance_assignments
CREATE POLICY "Users can view compliance assignments" 
  ON public.compliance_assignments 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create compliance assignments" 
  ON public.compliance_assignments 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update compliance assignments" 
  ON public.compliance_assignments 
  FOR UPDATE 
  USING (true);

-- Create RLS policies for compliance_metrics
CREATE POLICY "Users can view compliance metrics" 
  ON public.compliance_metrics 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create compliance metrics" 
  ON public.compliance_metrics 
  FOR INSERT 
  WITH CHECK (true);

-- Create RLS policies for escalation_items
CREATE POLICY "Users can view escalation items" 
  ON public.escalation_items 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create escalation items" 
  ON public.escalation_items 
  FOR INSERT 
  WITH CHECK (true);

-- Enable real-time functionality
ALTER TABLE public.compliance_assignments REPLICA IDENTITY FULL;
ALTER TABLE public.compliance_metrics REPLICA IDENTITY FULL;
ALTER TABLE public.escalation_items REPLICA IDENTITY FULL;

-- Add tables to real-time publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.compliance_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.compliance_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.escalation_items;

-- Create indexes for better performance
CREATE INDEX idx_compliance_assignments_status ON public.compliance_assignments(status);
CREATE INDEX idx_compliance_assignments_due_date ON public.compliance_assignments(due_date);
CREATE INDEX idx_compliance_metrics_date ON public.compliance_metrics(metric_date);
CREATE INDEX idx_escalation_items_level ON public.escalation_items(escalation_level);

-- Create function to calculate TAT breaches (fixed EXTRACT function)
CREATE OR REPLACE FUNCTION calculate_tat_metrics()
RETURNS TABLE (
  total_assignments BIGINT,
  overdue_count BIGINT,
  tat_breaches BIGINT,
  avg_days_overdue NUMERIC
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    COUNT(*) as total_assignments,
    COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status != 'approved') as overdue_count,
    COUNT(*) FILTER (WHERE due_date < CURRENT_DATE - INTERVAL '1 day' AND status != 'approved') as tat_breaches,
    COALESCE(AVG(CURRENT_DATE - due_date) FILTER (WHERE due_date < CURRENT_DATE), 0) as avg_days_overdue
  FROM public.compliance_assignments;
$$;

-- Create function to update compliance metrics daily
CREATE OR REPLACE FUNCTION update_daily_metrics()
RETURNS void
LANGUAGE plpgsql
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
