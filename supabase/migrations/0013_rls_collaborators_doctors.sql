-- 0013_rls_collaborators_doctors.sql
-- Consolidate Advanced RLS for Collaborators and Doctors

-- ============================================
-- TASKS
-- ============================================

-- Collaborator: can only view and update tasks assigned to them
CREATE POLICY "Collaborators can view assigned tasks" ON tasks
    FOR SELECT
    USING (
        assigned_to = auth.uid() AND
        organization_id IN (
            SELECT organization_id FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'collaborator'
        )
    );

CREATE POLICY "Collaborators can update assigned tasks" ON tasks
    FOR UPDATE
    USING (
        assigned_to = auth.uid() AND
        organization_id IN (
            SELECT organization_id FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'collaborator'
        )
    )
    WITH CHECK (
        assigned_to = auth.uid() AND
        organization_id IN (
            SELECT organization_id FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'collaborator'
        )
    );

-- ============================================
-- CASES
-- ============================================

-- Update cases policy for Collaborators
CREATE POLICY "Collaborators can view assigned cases" ON cases
    FOR SELECT
    USING (
        assigned_to = auth.uid() AND
        organization_id IN (
            SELECT organization_id FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'collaborator'
        )
    );

CREATE POLICY "Collaborators can update assigned cases" ON cases
    FOR UPDATE
    USING (
        assigned_to = auth.uid() AND
        organization_id IN (
            SELECT organization_id FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'collaborator'
        )
    )
    WITH CHECK (
        assigned_to = auth.uid() AND
        organization_id IN (
            SELECT organization_id FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'collaborator'
        )
    );


-- Update cases policy for Doctors
CREATE POLICY "Doctors can view assigned cases" ON cases
    FOR SELECT
    USING (
        doctor_id = auth.uid() AND
        organization_id IN (
            SELECT organization_id FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'doctor'
        )
    );

CREATE POLICY "Doctors can update assigned cases" ON cases
    FOR UPDATE
    USING (
        doctor_id = auth.uid() AND
        organization_id IN (
            SELECT organization_id FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'doctor'
        )
    )
    WITH CHECK (
        doctor_id = auth.uid() AND
        organization_id IN (
            SELECT organization_id FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'doctor'
        )
    );

-- ============================================
-- CONTACTS
-- ============================================

-- Collaborator and Doctor: can view contacts related to their assigned cases
CREATE POLICY "Collaborators and Doctors can view related contacts" ON contacts
    FOR SELECT
    USING (
        id IN (
            SELECT contact_id FROM cases WHERE assigned_to = auth.uid() OR doctor_id = auth.uid()
        ) AND
        organization_id IN (
            SELECT organization_id FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('collaborator', 'doctor')
        )
    );

-- ============================================
-- DOCUMENTS
-- ============================================

-- Collaborator and Doctor: can view documents related to their assigned cases
CREATE POLICY "Collaborators and Doctors can view related documents" ON documents
    FOR SELECT
    USING (
        case_id IN (
            SELECT id FROM cases WHERE assigned_to = auth.uid() OR doctor_id = auth.uid()
        ) AND
        organization_id IN (
            SELECT organization_id FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('collaborator', 'doctor')
        )
    );
