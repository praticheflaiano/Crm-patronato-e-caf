-- Case Notes Table
CREATE TABLE IF NOT EXISTS case_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    author_id UUID REFERENCES public.profiles(id),
    organization_id UUID REFERENCES organizations(id)
);

-- Enable RLS
ALTER TABLE case_notes ENABLE ROW LEVEL SECURITY;

-- Basic Policies for case_notes (similar to tasks)
CREATE POLICY "Users can view notes in their organization"
    ON case_notes FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create notes in their organization"
    ON case_notes FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own notes or admins can update any in their org"
    ON case_notes FOR UPDATE
    USING (
        author_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.organization_id = case_notes.organization_id
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Users can delete their own notes or admins can delete any in their org"
    ON case_notes FOR DELETE
    USING (
        author_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.organization_id = case_notes.organization_id
            AND profiles.role = 'admin'
        )
    );

-- Trigger for updated_at
CREATE TRIGGER update_case_notes_updated_at
    BEFORE UPDATE ON case_notes
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
