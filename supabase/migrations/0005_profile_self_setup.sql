create policy "Authenticated users can view default organization for setup" on organizations
    for select using (slug = 'centro-pratiche-flaiano' and auth.role() = 'authenticated');
