-- =====================================================================
-- Knowledge base (RAG) + persistent chat memory.
--
-- Embeddings are produced by the `embed` Edge Function (Supabase built-in
-- gte-small model, 384 dims, no API key) and stored in pgvector. Everything is
-- scoped per organization / per user via RLS, reusing current_user_org_id().
-- =====================================================================

create table if not exists public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  source_type text not null default 'file' check (source_type in ('file','text')),
  storage_path text,
  byte_size bigint,
  status text not null default 'pending' check (status in ('pending','processing','ready','error')),
  error_message text,
  chunk_count integer not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists knowledge_documents_org_idx on public.knowledge_documents (organization_id);

create table if not exists public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.knowledge_documents(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  embedding vector(384),
  created_at timestamptz not null default now()
);
create index if not exists knowledge_chunks_doc_idx on public.knowledge_chunks (document_id);
create index if not exists knowledge_chunks_org_idx on public.knowledge_chunks (organization_id);
create index if not exists knowledge_chunks_embedding_idx
  on public.knowledge_chunks using hnsw (embedding vector_cosine_ops);

alter table public.knowledge_documents enable row level security;
alter table public.knowledge_chunks enable row level security;

drop policy if exists "Org members manage knowledge documents" on public.knowledge_documents;
create policy "Org members manage knowledge documents" on public.knowledge_documents
  for all
  using (organization_id = public.current_user_org_id())
  with check (organization_id = public.current_user_org_id());

drop policy if exists "Org members manage knowledge chunks" on public.knowledge_chunks;
create policy "Org members manage knowledge chunks" on public.knowledge_chunks
  for all
  using (organization_id = public.current_user_org_id())
  with check (organization_id = public.current_user_org_id());

grant select, insert, update, delete on public.knowledge_documents to authenticated;
grant select, insert, update, delete on public.knowledge_chunks to authenticated;
revoke all on public.knowledge_documents from anon;
revoke all on public.knowledge_chunks from anon;

drop trigger if exists knowledge_documents_updated_at on public.knowledge_documents;
create trigger knowledge_documents_updated_at
  before update on public.knowledge_documents
  for each row execute procedure public.update_updated_at_column();

-- Similarity search, hard-scoped to the caller's organization. search_path is
-- public so the pgvector operators (installed in public) resolve.
create or replace function public.match_knowledge_chunks(
  query_embedding vector(384),
  match_count integer default 5,
  similarity_threshold double precision default 0.3
)
returns table (
  content text,
  document_title text,
  similarity double precision
)
language sql stable security definer set search_path = public
as $$
  select kc.content,
         kd.title as document_title,
         1 - (kc.embedding <=> query_embedding) as similarity
  from public.knowledge_chunks kc
  join public.knowledge_documents kd on kd.id = kc.document_id
  where kc.organization_id = public.current_user_org_id()
    and kc.embedding is not null
    and 1 - (kc.embedding <=> query_embedding) > similarity_threshold
  order by kc.embedding <=> query_embedding
  limit greatest(1, least(match_count, 20));
$$;

revoke execute on function public.match_knowledge_chunks(vector, integer, double precision) from anon, public;
grant execute on function public.match_knowledge_chunks(vector, integer, double precision) to authenticated;

-- ---- Persistent chat memory (per user) ----
create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists chat_conversations_user_idx on public.chat_conversations (user_id, updated_at desc);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_conversation_idx on public.chat_messages (conversation_id, created_at);

alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "Users manage own conversations" on public.chat_conversations;
create policy "Users manage own conversations" on public.chat_conversations
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Users manage own chat messages" on public.chat_messages;
create policy "Users manage own chat messages" on public.chat_messages
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update, delete on public.chat_conversations to authenticated;
grant select, insert, update, delete on public.chat_messages to authenticated;
revoke all on public.chat_conversations from anon;
revoke all on public.chat_messages from anon;

drop trigger if exists chat_conversations_updated_at on public.chat_conversations;
create trigger chat_conversations_updated_at
  before update on public.chat_conversations
  for each row execute procedure public.update_updated_at_column();
