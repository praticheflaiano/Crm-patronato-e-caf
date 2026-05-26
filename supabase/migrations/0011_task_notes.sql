create table if not exists task_notes (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid references tasks(id) on delete cascade,
  author_id uuid references profiles(id),
  content text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- indice per ricerca veloce
create index if not exists task_notes_task_id_idx on task_notes(task_id);
create index if not exists task_notes_author_id_idx on task_notes(author_id);
