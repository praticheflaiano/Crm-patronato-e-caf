-- Notes Table
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_private BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
);

-- Triggers for updated_at
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Triggers for organization_id
create trigger set_notes_organization_id
before insert on notes
for each row execute procedure set_current_user_organization_id();

-- Enable RLS
alter table notes enable row level security;

-- Policies for notes
create policy "Users can view organization notes" on notes
    for select using (
        organization_id in (select organization_id from profiles where profiles.id = auth.uid())
        and (is_private = false or created_by = auth.uid() or 'admin' = (select role from profiles where id = auth.uid()))
    );

create policy "Users can insert organization notes" on notes
    for insert with check (
        organization_id in (select organization_id from profiles where profiles.id = auth.uid())
    );

create policy "Users can update their own notes or admins can update any" on notes
    for update using (
        organization_id in (select organization_id from profiles where profiles.id = auth.uid())
        and (created_by = auth.uid() or 'admin' = (select role from profiles where id = auth.uid()))
    )
    with check (
        organization_id in (select organization_id from profiles where profiles.id = auth.uid())
    );

create policy "Admins or creator can delete notes" on notes
    for delete using (
        organization_id in (select organization_id from profiles where profiles.id = auth.uid())
        and (created_by = auth.uid() or 'admin' = (select role from profiles where id = auth.uid()))
    );
