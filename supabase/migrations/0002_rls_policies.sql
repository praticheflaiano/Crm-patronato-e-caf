-- Enable Row Level Security
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_certificates ENABLE ROW LEVEL SECURITY;

-- Contacts Policies
-- Users can view all contacts
CREATE POLICY "Users can view all contacts" ON contacts
    FOR SELECT USING (auth.role() = 'authenticated');

-- Users can insert contacts
CREATE POLICY "Users can insert contacts" ON contacts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Users can update contacts
CREATE POLICY "Users can update contacts" ON contacts
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Users can delete contacts
CREATE POLICY "Users can delete contacts" ON contacts
    FOR DELETE USING (auth.role() = 'authenticated');

-- Cases Policies
CREATE POLICY "Users can view all cases" ON cases
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert cases" ON cases
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update cases" ON cases
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete cases" ON cases
    FOR DELETE USING (auth.role() = 'authenticated');

-- Documents Policies
CREATE POLICY "Users can view all documents" ON documents
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert documents" ON documents
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update documents" ON documents
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete documents" ON documents
    FOR DELETE USING (auth.role() = 'authenticated');

-- Tasks Policies
CREATE POLICY "Users can view all tasks" ON tasks
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert tasks" ON tasks
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update tasks" ON tasks
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete tasks" ON tasks
    FOR DELETE USING (auth.role() = 'authenticated');

-- Medical Certificates Policies
CREATE POLICY "Users can view all medical certificates" ON medical_certificates
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert medical certificates" ON medical_certificates
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update medical certificates" ON medical_certificates
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete medical certificates" ON medical_certificates
    FOR DELETE USING (auth.role() = 'authenticated');

-- Supabase Storage Policies for Documents Bucket (Requires 'documents' bucket to exist)
-- Assuming a bucket named 'documents' exists
-- CREATE POLICY "Authenticated users can view documents" ON storage.objects FOR SELECT USING (bucket_id = 'documents' AND auth.role() = 'authenticated');
-- CREATE POLICY "Authenticated users can upload documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');
-- CREATE POLICY "Authenticated users can update documents" ON storage.objects FOR UPDATE USING (bucket_id = 'documents' AND auth.role() = 'authenticated');
-- CREATE POLICY "Authenticated users can delete documents" ON storage.objects FOR DELETE USING (bucket_id = 'documents' AND auth.role() = 'authenticated');
