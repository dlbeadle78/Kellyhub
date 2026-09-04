create table if not exists public.library_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  capture_id uuid references public.quick_capture(id) on delete set null,
  subject_slug text,
  unit_slug text,
  topic_slug text,
  title text not null,
  purpose text not null check (purpose in ('learn','do','improve','keep')),
  resource_type text not null default 'resource',
  source_url text,
  summary text,
  extracted_text text,
  tags text[] not null default '{}',
  linked_task_id uuid references public.tasks(id) on delete set null,
  status text not null default 'active' check (status in ('active','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, capture_id, purpose)
);

create table if not exists public.library_chunks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  library_item_id uuid not null references public.library_items(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  source_label text,
  created_at timestamptz not null default now(),
  unique (library_item_id, chunk_index)
);

create table if not exists public.feedback_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  capture_id uuid references public.quick_capture(id) on delete set null,
  library_item_id uuid references public.library_items(id) on delete set null,
  subject_slug text,
  title text not null,
  target text not null,
  status text not null default 'active' check (status in ('active','achieved','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.quick_capture
  add column if not exists library_status text not null default 'inbox' check (library_status in ('inbox','partly_processed','processed')),
  add column if not exists library_processed_at timestamptz;

create index if not exists library_items_user_created_idx on public.library_items(user_id, created_at desc);
create index if not exists library_items_subject_idx on public.library_items(user_id, subject_slug);
create index if not exists library_items_topic_idx on public.library_items(user_id, subject_slug, unit_slug, topic_slug);
create index if not exists library_chunks_item_idx on public.library_chunks(library_item_id, chunk_index);
create index if not exists feedback_targets_user_status_idx on public.feedback_targets(user_id, status, created_at desc);

alter table public.library_items enable row level security;
alter table public.library_chunks enable row level security;
alter table public.feedback_targets enable row level security;

drop policy if exists library_items_owner_or_admin on public.library_items;
create policy library_items_owner_or_admin on public.library_items for all
using ((user_id = (select auth.uid())) or is_admin())
with check ((user_id = (select auth.uid())) or is_admin());

drop policy if exists library_chunks_owner_or_admin on public.library_chunks;
create policy library_chunks_owner_or_admin on public.library_chunks for all
using ((user_id = (select auth.uid())) or is_admin())
with check ((user_id = (select auth.uid())) or is_admin());

drop policy if exists feedback_targets_owner_or_admin on public.feedback_targets;
create policy feedback_targets_owner_or_admin on public.feedback_targets for all
using ((user_id = (select auth.uid())) or is_admin())
with check ((user_id = (select auth.uid())) or is_admin());

create or replace function public.set_library_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists library_items_set_updated_at on public.library_items;
create trigger library_items_set_updated_at before update on public.library_items
for each row execute function public.set_library_updated_at();

drop trigger if exists feedback_targets_set_updated_at on public.feedback_targets;
create trigger feedback_targets_set_updated_at before update on public.feedback_targets
for each row execute function public.set_library_updated_at();
