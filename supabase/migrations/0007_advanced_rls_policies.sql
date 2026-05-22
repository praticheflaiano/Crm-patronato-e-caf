
-- 0007_advanced_rls_policies.sql
CREATE POLICY "Collaboratori: solo pratiche assegnate" 
ON cases FOR SELECT USING (
  organization_id = auth.uid() AND
  assigned_to = auth.uid()
);

CREATE POLICY "Medici: solo pratiche di invalidità" 
ON cases FOR SELECT USING (
  type = 'invalidita_civile' AND
  doctor_id = auth.uid()
);

CREATE POLICY "Task: visibilità basata su pratiche"
ON tasks FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM cases 
    WHERE cases.id = tasks.case_id
    AND cases.organization_id = auth.uid()
  )
);
