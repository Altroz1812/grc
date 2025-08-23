
-- Create departments table
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  head TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  employee_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  user_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create employees table
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  emp_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  department_code TEXT REFERENCES public.departments(code) ON DELETE SET NULL,
  designation TEXT,
  role_name TEXT REFERENCES public.user_roles(role_name) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create compliances table
CREATE TABLE public.compliances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  compliance_id TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  section TEXT,
  short_description TEXT,
  description TEXT,
  risk_type TEXT,
  frequency TEXT NOT NULL,
  department_code TEXT REFERENCES public.departments(code) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  next_due DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliances ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is an internal system)
CREATE POLICY "Enable read access for all users" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.departments FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.departments FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.departments FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.user_roles FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.user_roles FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.user_roles FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.employees FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.employees FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.employees FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.employees FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.compliances FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.compliances FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.compliances FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.compliances FOR DELETE USING (true);

-- Enable realtime for all tables
ALTER TABLE public.departments REPLICA IDENTITY FULL;
ALTER TABLE public.user_roles REPLICA IDENTITY FULL;
ALTER TABLE public.employees REPLICA IDENTITY FULL;
ALTER TABLE public.compliances REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.departments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.employees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.compliances;

-- Insert sample data for departments
INSERT INTO public.departments (name, code, head, employee_count) VALUES
('Credit Risk Management', 'CRM', 'John Doe', 15),
('Treasury Operations', 'TRO', 'Jane Smith', 8),
('Finance & Accounts', 'FIN', 'Mike Johnson', 12),
('Legal & Compliance', 'LEG', 'Sarah Wilson', 6),
('Information Technology', 'IT', 'David Brown', 10);

-- Insert sample data for user roles
INSERT INTO public.user_roles (role_name, description, permissions, user_count) VALUES
('Admin', 'Full system access with all administrative privileges', ARRAY['Create', 'Read', 'Update', 'Delete', 'Approve', 'Manage Users'], 2),
('Compliance Officer', 'Monitor and oversee compliance activities', ARRAY['Create', 'Read', 'Update', 'Review', 'Generate Reports'], 3),
('Maker', 'Create and submit compliance entries', ARRAY['Create', 'Read', 'Submit'], 8),
('Checker', 'Review and approve submitted entries', ARRAY['Read', 'Approve', 'Reject', 'Review'], 5),
('Viewer', 'Read-only access to compliance data', ARRAY['Read'], 12),
('Auditor', 'Audit compliance processes and generate reports', ARRAY['Read', 'Audit', 'Generate Reports', 'Export Data'], 3);

-- Insert sample data for employees
INSERT INTO public.employees (emp_id, name, email, phone, department_code, designation, role_name) VALUES
('EMP001', 'John Doe', 'john.doe@bank.com', '+91-9876543210', 'CRM', 'Manager', 'Maker'),
('EMP002', 'Jane Smith', 'jane.smith@bank.com', '+91-9876543211', 'TRO', 'Senior Officer', 'Checker'),
('EMP003', 'Mike Johnson', 'mike.johnson@bank.com', '+91-9876543212', 'FIN', 'Assistant Manager', 'Compliance Officer'),
('EMP004', 'Sarah Wilson', 'sarah.wilson@bank.com', '+91-9876543213', 'LEG', 'Chief Manager', 'Admin');

-- Insert sample data for compliances
INSERT INTO public.compliances (compliance_id, category, name, section, short_description, description, risk_type, frequency, department_code, next_due) VALUES
('RBI001', 'AML/CFT', 'Suspicious Transaction Report (STR)', 'Section 12', 'Monthly STR filing to FIU-IND', 'Filing of Suspicious Transaction Reports to Financial Intelligence Unit India as per RBI guidelines', 'Operational Risk', 'Monthly', 'CRM', '2024-07-15'),
('RBI002', 'ALM', 'Asset Liability Management Return', 'Section 25', 'Quarterly ALM return submission', 'Quarterly submission of Asset Liability Management returns to RBI', 'Market Risk', 'Quarterly', 'TRO', '2024-07-30'),
('RBI003', 'Credit Risk', 'NPA Classification Report', 'Section 18', 'Monthly NPA classification and provisioning', 'Classification and provisioning of Non-Performing Assets as per RBI norms', 'Credit Risk', 'Monthly', 'CRM', '2024-07-10');
