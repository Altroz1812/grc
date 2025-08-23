
-- Create the compliance-documents storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('compliance-documents', 'compliance-documents', true);

-- Create RLS policies for the bucket to allow public access
CREATE POLICY "Allow public uploads to compliance-documents" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'compliance-documents');

CREATE POLICY "Allow public downloads from compliance-documents" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'compliance-documents');

CREATE POLICY "Allow public updates to compliance-documents" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'compliance-documents');

CREATE POLICY "Allow public deletes from compliance-documents" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'compliance-documents');
