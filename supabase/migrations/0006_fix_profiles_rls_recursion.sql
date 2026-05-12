drop policy if exists "Users can view profiles in their organization" on profiles;

create policy "Users can view their own profile" on profiles
    for select using (id = auth.uid());
