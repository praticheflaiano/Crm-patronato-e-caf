create type user_role as enum ('admin', 'operator', 'collaborator', 'doctor');

create table if not exists organizations (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    slug text unique not null,
    created_at timestamptz default now()
);

insert into organizations (name, slug)
values ('Centro Pratiche Flaiano', 'centro-pratiche-flaiano')
on conflict (slug) do nothing;

create table if not exists profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    organization_id uuid not null references organizations(id) on delete cascade,
    full_name text,
    role user_role not null default 'operator',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

alter table contacts add column if not exists organization_id uuid references organizations(id);
alter table cases add column if not exists organization_id uuid references organizations(id);
alter table documents add column if not exists organization_id uuid references organizations(id);
alter table tasks add column if not exists organization_id uuid references organizations(id);
alter table medical_certificates add column if not exists organization_id uuid references organizations(id);

update contacts
set organization_id = (select id from organizations where slug = 'centro-pratiche-flaiano')
where organization_id is null;

update cases
set organization_id = (select id from organizations where slug = 'centro-pratiche-flaiano')
where organization_id is null;

update documents
set organization_id = (select id from organizations where slug = 'centro-pratiche-flaiano')
where organization_id is null;

update tasks
set organization_id = (select id from organizations where slug = 'centro-pratiche-flaiano')
where organization_id is null;

update medical_certificates
set organization_id = (select id from organizations where slug = 'centro-pratiche-flaiano')
where organization_id is null;

alter table contacts alter column organization_id set not null;
alter table cases alter column organization_id set not null;
alter table documents alter column organization_id set not null;
alter table tasks alter column organization_id set not null;
alter table medical_certificates alter column organization_id set not null;

create or replace function set_current_user_organization_id()
returns trigger as $$
begin
    if new.organization_id is null then
        select organization_id
        into new.organization_id
        from profiles
        where id = auth.uid();
    end if;

    return new;
end;
$$ language plpgsql;

drop trigger if exists set_contacts_organization_id on contacts;
create trigger set_contacts_organization_id
before insert on contacts
for each row execute procedure set_current_user_organization_id();

drop trigger if exists set_cases_organization_id on cases;
create trigger set_cases_organization_id
before insert on cases
for each row execute procedure set_current_user_organization_id();

drop trigger if exists set_documents_organization_id on documents;
create trigger set_documents_organization_id
before insert on documents
for each row execute procedure set_current_user_organization_id();

drop trigger if exists set_tasks_organization_id on tasks;
create trigger set_tasks_organization_id
before insert on tasks
for each row execute procedure set_current_user_organization_id();

drop trigger if exists set_medical_certificates_organization_id on medical_certificates;
create trigger set_medical_certificates_organization_id
before insert on medical_certificates
for each row execute procedure set_current_user_organization_id();

drop trigger if exists update_profiles_updated_at on profiles;
create trigger update_profiles_updated_at
before update on profiles
for each row execute procedure update_updated_at_column();

alter table organizations enable row level security;
alter table profiles enable row level security;

create policy "Users can view their organization" on organizations
    for select using (
        id in (
            select organization_id
            from profiles
            where profiles.id = auth.uid()
        )
    );

create policy "Users can view profiles in their organization" on profiles
    for select using (
        organization_id in (
            select organization_id
            from profiles
            where profiles.id = auth.uid()
        )
    );

create policy "Users can insert their own profile" on profiles
    for insert with check (id = auth.uid());

create policy "Users can update their own profile" on profiles
    for update using (id = auth.uid())
    with check (id = auth.uid());

insert into profiles (id, organization_id, full_name, role)
select
    users.id,
    (select id from organizations where slug = 'centro-pratiche-flaiano'),
    coalesce(users.raw_user_meta_data->>'full_name', users.email),
    case
        when users.email in ('praticheflaiano@gmail.com', 'admin@praticheflaiano.it') then 'admin'::user_role
        else 'operator'::user_role
    end
from auth.users
where not exists (
    select 1 from profiles where profiles.id = users.id
);

drop policy if exists "Users can view all contacts" on contacts;
drop policy if exists "Users can insert contacts" on contacts;
drop policy if exists "Users can update contacts" on contacts;
drop policy if exists "Users can delete contacts" on contacts;

create policy "Users can view organization contacts" on contacts
    for select using (
        organization_id in (select organization_id from profiles where profiles.id = auth.uid())
    );

create policy "Users can insert organization contacts" on contacts
    for insert with check (
        organization_id in (select organization_id from profiles where profiles.id = auth.uid())
    );

create policy "Users can update organization contacts" on contacts
    for update using (
        organization_id in (select organization_id from profiles where profiles.id = auth.uid())
    )
    with check (
        organization_id in (select organization_id from profiles where profiles.id = auth.uid())
    );

create policy "Admins can delete organization contacts" on contacts
    for delete using (
        organization_id in (
            select organization_id
            from profiles
            where profiles.id = auth.uid()
              and profiles.role = 'admin'
        )
    );

drop policy if exists "Users can view all cases" on cases;
drop policy if exists "Users can insert cases" on cases;
drop policy if exists "Users can update cases" on cases;
drop policy if exists "Users can delete cases" on cases;

create policy "Users can view organization cases" on cases
    for select using (
        organization_id in (select organization_id from profiles where profiles.id = auth.uid())
    );

create policy "Users can insert organization cases" on cases
    for insert with check (
        organization_id in (select organization_id from profiles where profiles.id = auth.uid())
    );

create policy "Users can update organization cases" on cases
    for update using (
        organization_id in (select organization_id from profiles where profiles.id = auth.uid())
    )
    with check (
        organization_id in (select organization_id from profiles where profiles.id = auth.uid())
    );

create policy "Admins can delete organization cases" on cases
    for delete using (
        organization_id in (
            select organization_id
            from profiles
            where profiles.id = auth.uid()
              and profiles.role = 'admin'
        )
    );

drop policy if exists "Users can view all documents" on documents;
drop policy if exists "Users can insert documents" on documents;
drop policy if exists "Users can update documents" on documents;
drop policy if exists "Users can delete documents" on documents;

create policy "Users can view organization documents" on documents
    for select using (
        organization_id in (select organization_id from profiles where profiles.id = auth.uid())
    );

create policy "Users can insert organization documents" on documents
    for insert with check (
        organization_id in (select organization_id from profiles where profiles.id = auth.uid())
    );

create policy "Users can update organization documents" on documents
    for update using (
        organization_id in (select organization_id from profiles where profiles.id = auth.uid())
    )
    with check (
        organization_id in (select organization_id from profiles where profiles.id = auth.uid())
    );

create policy "Admins can delete organization documents" on documents
    for delete using (
        organization_id in (
            select organization_id
            from profiles
            where profiles.id = auth.uid()
              and profiles.role = 'admin'
        )
    );

drop policy if exists "Users can view all tasks" on tasks;
drop policy if exists "Users can insert tasks" on tasks;
drop policy if exists "Users can update tasks" on tasks;
drop policy if exists "Users can delete tasks" on tasks;

create policy "Users can view organization tasks" on tasks
    for select using (
        organization_id in (select organization_id from profiles where profiles.id = auth.uid())
    );

create policy "Users can insert organization tasks" on tasks
    for insert with check (
        organization_id in (select organization_id from profiles where profiles.id = auth.uid())
    );

create policy "Users can update organization tasks" on tasks
    for update using (
        organization_id in (select organization_id from profiles where profiles.id = auth.uid())
    )
    with check (
        organization_id in (select organization_id from profiles where profiles.id = auth.uid())
    );

create policy "Admins can delete organization tasks" on tasks
    for delete using (
        organization_id in (
            select organization_id
            from profiles
            where profiles.id = auth.uid()
              and profiles.role = 'admin'
        )
    );

drop policy if exists "Users can view all medical certificates" on medical_certificates;
drop policy if exists "Users can insert medical certificates" on medical_certificates;
drop policy if exists "Users can update medical certificates" on medical_certificates;
drop policy if exists "Users can delete medical certificates" on medical_certificates;

create policy "Users can view organization medical certificates" on medical_certificates
    for select using (
        organization_id in (select organization_id from profiles where profiles.id = auth.uid())
    );

create policy "Users can insert organization medical certificates" on medical_certificates
    for insert with check (
        organization_id in (select organization_id from profiles where profiles.id = auth.uid())
    );

create policy "Users can update organization medical certificates" on medical_certificates
    for update using (
        organization_id in (select organization_id from profiles where profiles.id = auth.uid())
    )
    with check (
        organization_id in (select organization_id from profiles where profiles.id = auth.uid())
    );

create policy "Admins can delete organization medical certificates" on medical_certificates
    for delete using (
        organization_id in (
            select organization_id
            from profiles
            where profiles.id = auth.uid()
              and profiles.role = 'admin'
        )
    );
