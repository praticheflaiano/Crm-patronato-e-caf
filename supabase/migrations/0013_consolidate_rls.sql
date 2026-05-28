-- 0013_consolidate_rls.sql
-- Drop old overlapping policies

-- Contacts
DROP POLICY IF EXISTS "Users can view all contacts" ON contacts;
DROP POLICY IF EXISTS "Users can insert contacts" ON contacts;
DROP POLICY IF EXISTS "Users can update contacts" ON contacts;
DROP POLICY IF EXISTS "Users can delete contacts" ON contacts;
DROP POLICY IF EXISTS "Users can view organization contacts" ON contacts;
DROP POLICY IF EXISTS "Users can insert organization contacts" ON contacts;
DROP POLICY IF EXISTS "Users can update organization contacts" ON contacts;
DROP POLICY IF EXISTS "Admins can delete organization contacts" ON contacts;

-- Cases
DROP POLICY IF EXISTS "Users can view all cases" ON cases;
DROP POLICY IF EXISTS "Users can insert cases" ON cases;
DROP POLICY IF EXISTS "Users can update cases" ON cases;
DROP POLICY IF EXISTS "Users can delete cases" ON cases;
DROP POLICY IF EXISTS "Users can view organization cases" ON cases;
DROP POLICY IF EXISTS "Users can insert organization cases" ON cases;
DROP POLICY IF EXISTS "Users can update organization cases" ON cases;
DROP POLICY IF EXISTS "Admins can delete organization cases" ON cases;
DROP POLICY IF EXISTS "Collaboratori: solo pratiche assegnate" ON cases;
DROP POLICY IF EXISTS "Medici: solo pratiche di invalidità" ON cases;

-- Documents
DROP POLICY IF EXISTS "Users can view all documents" ON documents;
DROP POLICY IF EXISTS "Users can insert documents" ON documents;
DROP POLICY IF EXISTS "Users can update documents" ON documents;
DROP POLICY IF EXISTS "Users can delete documents" ON documents;
DROP POLICY IF EXISTS "Users can view organization documents" ON documents;
DROP POLICY IF EXISTS "Users can insert organization documents" ON documents;
DROP POLICY IF EXISTS "Users can update organization documents" ON documents;
DROP POLICY IF EXISTS "Admins can delete organization documents" ON documents;

-- Tasks
DROP POLICY IF EXISTS "Users can view all tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete tasks" ON tasks;
DROP POLICY IF EXISTS "Users can view organization tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert organization tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update organization tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can delete organization tasks" ON tasks;
DROP POLICY IF EXISTS "Task: visibilità basata su pratiche" ON tasks;

-- Medical Certificates
DROP POLICY IF EXISTS "Users can view all medical certificates" ON medical_certificates;
DROP POLICY IF EXISTS "Users can insert medical certificates" ON medical_certificates;
DROP POLICY IF EXISTS "Users can update medical certificates" ON medical_certificates;
DROP POLICY IF EXISTS "Users can delete medical certificates" ON medical_certificates;
DROP POLICY IF EXISTS "Users can view organization medical certificates" ON medical_certificates;
DROP POLICY IF EXISTS "Users can insert organization medical certificates" ON medical_certificates;
DROP POLICY IF EXISTS "Users can update organization medical certificates" ON medical_certificates;
DROP POLICY IF EXISTS "Admins can delete organization medical certificates" ON medical_certificates;
DROP POLICY IF EXISTS "Admin and operator can manage medical_certificates" ON medical_certificates;
DROP POLICY IF EXISTS "Doctor can view assigned medical_certificates" ON medical_certificates;
DROP POLICY IF EXISTS "Doctor can insert medical_certificates for assigned cases" ON medical_certificates;
DROP POLICY IF EXISTS "Doctor can update medical_certificates for assigned cases" ON medical_certificates;
DROP POLICY IF EXISTS "Collaborator can view medical_certificates" ON medical_certificates;

-- Invalidity details
DROP POLICY IF EXISTS "Admin and operator can manage invalidity_details" ON invalidity_details;
DROP POLICY IF EXISTS "Doctor can view assigned invalidity_details" ON invalidity_details;
DROP POLICY IF EXISTS "Doctor can update assigned invalidity_details" ON invalidity_details;
DROP POLICY IF EXISTS "Collaborator can view invalidity_details" ON invalidity_details;


-- Contacts policies
CREATE POLICY "View organization contacts" ON contacts FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Insert organization contacts" ON contacts FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Update organization contacts" ON contacts FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
) WITH CHECK (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Delete organization contacts (Admin)" ON contacts FOR DELETE USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'admin')
);


-- Cases policies
CREATE POLICY "View organization cases" ON cases FOR SELECT USING (
    -- Admins and operators can view all cases in their organization
    (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'operator')))
    OR
    -- Collaborators can only view cases assigned to them
    (assigned_to = auth.uid() AND organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'collaborator'))
    OR
    -- Doctors can view cases they are assigned to
    (doctor_id = auth.uid() AND organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'doctor'))
);

CREATE POLICY "Insert organization cases" ON cases FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'operator', 'collaborator'))
);

CREATE POLICY "Update organization cases" ON cases FOR UPDATE USING (
    (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'operator')))
    OR
    (assigned_to = auth.uid() AND organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'collaborator'))
    OR
    (doctor_id = auth.uid() AND organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'doctor'))
) WITH CHECK (
    (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'operator')))
    OR
    (assigned_to = auth.uid() AND organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'collaborator'))
    OR
    (doctor_id = auth.uid() AND organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'doctor'))
);

CREATE POLICY "Delete organization cases (Admin)" ON cases FOR DELETE USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'admin')
);


-- Documents policies
CREATE POLICY "View organization documents" ON documents FOR SELECT USING (
    -- Similar to cases, allow admins, operators to see all.
    (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'operator')))
    OR
    -- Collaborators can view documents linked to their assigned cases, or general documents without a case?
    -- Assuming we just let them see all docs in org for now, or maybe only ones related to their cases.
    -- To keep it simple, we use the case link:
    (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'collaborator')
        AND (
            case_id IS NULL OR case_id IN (SELECT id FROM cases WHERE assigned_to = auth.uid())
        )
    )
    OR
    (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'doctor')
        AND (
            case_id IS NOT NULL AND case_id IN (SELECT id FROM cases WHERE doctor_id = auth.uid())
        )
    )
);

CREATE POLICY "Insert organization documents" ON documents FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'operator', 'collaborator', 'doctor'))
);

CREATE POLICY "Update organization documents" ON documents FOR UPDATE USING (
    (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'operator')))
    OR
    (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'collaborator')
        AND (
            case_id IS NULL OR case_id IN (SELECT id FROM cases WHERE assigned_to = auth.uid())
        )
    )
    OR
    (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'doctor')
        AND (
            case_id IS NOT NULL AND case_id IN (SELECT id FROM cases WHERE doctor_id = auth.uid())
        )
    )
) WITH CHECK (
    (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'operator')))
    OR
    (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'collaborator')
        AND (
            case_id IS NULL OR case_id IN (SELECT id FROM cases WHERE assigned_to = auth.uid())
        )
    )
    OR
    (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'doctor')
        AND (
            case_id IS NOT NULL AND case_id IN (SELECT id FROM cases WHERE doctor_id = auth.uid())
        )
    )
);

CREATE POLICY "Delete organization documents (Admin)" ON documents FOR DELETE USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'admin')
);


-- Tasks policies
CREATE POLICY "View organization tasks" ON tasks FOR SELECT USING (
    (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'operator')))
    OR
    -- Collaborators see tasks assigned to them, or tasks for cases assigned to them
    (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'collaborator')
        AND (
            assigned_to = auth.uid() OR case_id IN (SELECT id FROM cases WHERE assigned_to = auth.uid())
        )
    )
    OR
    -- Doctors see tasks for their cases
    (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'doctor')
        AND (
            case_id IN (SELECT id FROM cases WHERE doctor_id = auth.uid())
        )
    )
);

CREATE POLICY "Insert organization tasks" ON tasks FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Update organization tasks" ON tasks FOR UPDATE USING (
    (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'operator')))
    OR
    (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'collaborator')
        AND (
            assigned_to = auth.uid() OR case_id IN (SELECT id FROM cases WHERE assigned_to = auth.uid())
        )
    )
    OR
    (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'doctor')
        AND (
            case_id IN (SELECT id FROM cases WHERE doctor_id = auth.uid())
        )
    )
) WITH CHECK (
    (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'operator')))
    OR
    (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'collaborator')
        AND (
            assigned_to = auth.uid() OR case_id IN (SELECT id FROM cases WHERE assigned_to = auth.uid())
        )
    )
    OR
    (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'doctor')
        AND (
            case_id IN (SELECT id FROM cases WHERE doctor_id = auth.uid())
        )
    )
);

CREATE POLICY "Delete organization tasks (Admin)" ON tasks FOR DELETE USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'admin')
);


-- Medical Certificates policies
CREATE POLICY "View organization medical_certificates" ON medical_certificates FOR SELECT USING (
    (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'operator')))
    OR
    (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'collaborator')
        AND case_id IN (SELECT id FROM cases WHERE assigned_to = auth.uid())
    )
    OR
    (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'doctor')
        AND case_id IN (SELECT id FROM cases WHERE doctor_id = auth.uid())
    )
);

CREATE POLICY "Insert organization medical_certificates" ON medical_certificates FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'operator', 'doctor'))
);

CREATE POLICY "Update organization medical_certificates" ON medical_certificates FOR UPDATE USING (
    (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'operator')))
    OR
    (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'doctor')
        AND case_id IN (SELECT id FROM cases WHERE doctor_id = auth.uid())
    )
) WITH CHECK (
    (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'operator')))
    OR
    (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'doctor')
        AND case_id IN (SELECT id FROM cases WHERE doctor_id = auth.uid())
    )
);

CREATE POLICY "Delete organization medical_certificates (Admin)" ON medical_certificates FOR DELETE USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'admin')
);


-- Invalidity details policies
-- Invalidity details doesn't have an organization_id column, so we must join cases.
CREATE POLICY "View invalidity_details" ON invalidity_details FOR SELECT USING (
    (
        EXISTS (
            SELECT 1 FROM cases
            WHERE cases.id = invalidity_details.case_id
            AND cases.organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'operator'))
        )
    )
    OR
    (
        medical_examiner_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM cases
            WHERE cases.id = invalidity_details.case_id
            AND cases.doctor_id = auth.uid()
            AND cases.organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'doctor')
        )
    )
    OR
    (
        EXISTS (
            SELECT 1 FROM cases
            WHERE cases.id = invalidity_details.case_id
            AND cases.assigned_to = auth.uid()
            AND cases.organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'collaborator')
        )
    )
);

CREATE POLICY "Insert invalidity_details" ON invalidity_details FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM cases
        WHERE cases.id = case_id
        AND cases.organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'operator', 'doctor'))
    )
);

CREATE POLICY "Update invalidity_details" ON invalidity_details FOR UPDATE USING (
    (
        EXISTS (
            SELECT 1 FROM cases
            WHERE cases.id = invalidity_details.case_id
            AND cases.organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'operator'))
        )
    )
    OR
    (
        medical_examiner_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM cases
            WHERE cases.id = invalidity_details.case_id
            AND cases.doctor_id = auth.uid()
            AND cases.organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'doctor')
        )
    )
) WITH CHECK (
    (
        EXISTS (
            SELECT 1 FROM cases
            WHERE cases.id = invalidity_details.case_id
            AND cases.organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'operator'))
        )
    )
    OR
    (
        medical_examiner_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM cases
            WHERE cases.id = invalidity_details.case_id
            AND cases.doctor_id = auth.uid()
            AND cases.organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'doctor')
        )
    )
);

CREATE POLICY "Delete invalidity_details (Admin)" ON invalidity_details FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM cases
        WHERE cases.id = invalidity_details.case_id
        AND cases.organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
);
