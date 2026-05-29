-- 0013_consolidate_advanced_rls.sql
-- Consolidate Advanced RLS for Collaborators, Doctors, and Vertical Modules

-- Note: We assume that previous migrations have set up the tables and roles correctly.
-- We are replacing or ensuring correct policies for specific tables.

-- ============================================
-- CASES
-- ============================================
-- Drop conflicting previous policies
DROP POLICY IF EXISTS "Users can view organization cases" ON cases;
DROP POLICY IF EXISTS "Users can update organization cases" ON cases;

-- View cases: Admin/Operator see all in org; Collaborator sees assigned; Doctor sees assigned.
CREATE POLICY "Users can view cases" ON cases
    FOR SELECT
    USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid())
        AND (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'operator')
            )
            OR assigned_to = auth.uid()
            OR doctor_id = auth.uid()
        )
    );

-- Update cases: Admin/Operator can update any in org; Collaborator/Doctor can update assigned.
CREATE POLICY "Users can update cases" ON cases
    FOR UPDATE
    USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid())
        AND (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'operator')
            )
            OR assigned_to = auth.uid()
            OR doctor_id = auth.uid()
        )
    )
    WITH CHECK (
        organization_id IN (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid())
    );

-- ============================================
-- TASKS
-- ============================================
-- Drop conflicting previous policies
DROP POLICY IF EXISTS "Users can view organization tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update organization tasks" ON tasks;
DROP POLICY IF EXISTS "Task: visibilità basata su pratiche" ON tasks;

CREATE POLICY "Users can view tasks" ON tasks
    FOR SELECT
    USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid())
        AND (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'operator')
            )
            OR assigned_to = auth.uid()
            OR EXISTS (
                SELECT 1 FROM cases
                WHERE cases.id = tasks.case_id
                AND (cases.assigned_to = auth.uid() OR cases.doctor_id = auth.uid())
            )
        )
    );

CREATE POLICY "Users can update tasks" ON tasks
    FOR UPDATE
    USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid())
        AND (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'operator')
            )
            OR assigned_to = auth.uid()
            OR EXISTS (
                SELECT 1 FROM cases
                WHERE cases.id = tasks.case_id
                AND (cases.assigned_to = auth.uid() OR cases.doctor_id = auth.uid())
            )
        )
    )
    WITH CHECK (
        organization_id IN (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid())
    );

-- ============================================
-- DOCUMENTS
-- ============================================
DROP POLICY IF EXISTS "Users can view organization documents" ON documents;
DROP POLICY IF EXISTS "Users can update organization documents" ON documents;

CREATE POLICY "Users can view documents" ON documents
    FOR SELECT
    USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid())
        AND (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'operator')
            )
            OR EXISTS (
                SELECT 1 FROM cases
                WHERE cases.id = documents.case_id
                AND (cases.assigned_to = auth.uid() OR cases.doctor_id = auth.uid())
            )
        )
    );

CREATE POLICY "Users can update documents" ON documents
    FOR UPDATE
    USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid())
        AND (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'operator')
            )
            OR EXISTS (
                SELECT 1 FROM cases
                WHERE cases.id = documents.case_id
                AND (cases.assigned_to = auth.uid() OR cases.doctor_id = auth.uid())
            )
        )
    )
    WITH CHECK (
        organization_id IN (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid())
    );


-- ============================================
-- MEDICAL CERTIFICATES
-- ============================================
-- Note: 0009_invalidita_civile already introduced:
-- "Admin and operator can manage medical_certificates"
-- "Doctor can view assigned medical_certificates"
-- "Doctor can update medical_certificates for assigned cases"
-- "Collaborator can view medical_certificates"
-- "Users can view organization medical certificates" (from 0004)
-- Let's consolidate them to avoid overlap and confusion.

DROP POLICY IF EXISTS "Users can view organization medical certificates" ON medical_certificates;
DROP POLICY IF EXISTS "Users can update organization medical certificates" ON medical_certificates;
DROP POLICY IF EXISTS "Admin and operator can manage medical_certificates" ON medical_certificates;
DROP POLICY IF EXISTS "Doctor can view assigned medical_certificates" ON medical_certificates;
DROP POLICY IF EXISTS "Doctor can update medical_certificates for assigned cases" ON medical_certificates;
DROP POLICY IF EXISTS "Collaborator can view medical_certificates" ON medical_certificates;

CREATE POLICY "Users can view medical certificates" ON medical_certificates
    FOR SELECT
    USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid())
        AND (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'operator')
            )
            OR EXISTS (
                SELECT 1 FROM cases
                WHERE cases.id = medical_certificates.case_id
                AND (cases.assigned_to = auth.uid() OR cases.doctor_id = auth.uid())
            )
        )
    );

CREATE POLICY "Users can update medical certificates" ON medical_certificates
    FOR UPDATE
    USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid())
        AND (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'operator')
            )
            OR EXISTS (
                SELECT 1 FROM cases
                WHERE cases.id = medical_certificates.case_id
                AND cases.doctor_id = auth.uid()
            )
        )
    )
    WITH CHECK (
        organization_id IN (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid())
    );

-- Also fix insert logic for medical certificates
DROP POLICY IF EXISTS "Users can insert organization medical certificates" ON medical_certificates;
DROP POLICY IF EXISTS "Doctor can insert medical_certificates for assigned cases" ON medical_certificates;

CREATE POLICY "Users can insert medical certificates" ON medical_certificates
    FOR INSERT
    WITH CHECK (
        organization_id IN (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid())
        AND (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'operator')
            )
            OR EXISTS (
                SELECT 1 FROM cases
                WHERE cases.id = medical_certificates.case_id
                AND cases.doctor_id = auth.uid()
            )
        )
    );
