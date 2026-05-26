alter table task_notes enable row level security;

-- solo utenti della stessa organization possono vedere le note della task
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'task_notes'
      and policyname = 'Users can view task notes'
  ) then
    create policy "Users can view task notes"
      on task_notes for select
      using (
        exists (
          select 1
          from tasks t
          join profiles p on p.id = auth.uid()
          where t.id = task_notes.task_id
            and t.organization_id = p.organization_id
        )
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'task_notes'
      and policyname = 'Users can insert task notes'
  ) then
    create policy "Users can insert task notes"
      on task_notes for insert
      with check (
        exists (
          select 1
          from tasks t
          join profiles p on p.id = auth.uid()
          where t.id = task_notes.task_id
            and t.organization_id = p.organization_id
        )
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'task_notes'
      and policyname = 'Users can update own notes'
  ) then
    create policy "Users can update own notes"
      on task_notes for update
      using (author_id = auth.uid())
      with check (author_id = auth.uid());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'task_notes'
      and policyname = 'Users can delete own notes'
  ) then
    create policy "Users can delete own notes"
      on task_notes for delete
      using (author_id = auth.uid());
  end if;
end $$;
