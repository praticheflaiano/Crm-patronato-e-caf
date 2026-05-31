-- Onboarding con approvazione admin (parte 1/2): stato del membro.
--
-- Prima chiunque si registrava otteneva un profilo con accesso completo
-- all'organizzazione. Introduciamo uno stato di account: i nuovi utenti nascono
-- "pending" e restano senza organizzazione finché un admin non li approva.
-- Idempotente: ri-eseguibile su un DB pulito.

do $$ begin
  create type public.member_status as enum ('pending', 'active', 'disabled');
exception when duplicate_object then null; end $$;

alter table public.profiles
  add column if not exists status public.member_status not null default 'pending';

-- I membri gia' presenti al momento della migrazione mantengono l'accesso.
update public.profiles set status = 'active' where status <> 'active';

-- Un account in attesa non ha organizzazione: cosi' tutte le policy operative
-- "organization_id IN (...)" lo escludono automaticamente, senza riscriverle.
alter table public.profiles alter column organization_id drop not null;
