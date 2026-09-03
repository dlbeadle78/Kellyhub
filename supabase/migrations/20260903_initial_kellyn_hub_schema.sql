-- Kellyn Hub initial schema
-- This migration mirrors the schema applied to the connected Supabase project on 3 September 2026.
-- Keep runtime data out of source control.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'student' check (role in ('student','admin')),
  dyslexic_font boolean not null default false,
  text_scale numeric(3,2) not null default 1.00 check (text_scale between 0.90 and 1.40),
  dark_mode boolean not null default false,
  reduced_motion boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin');
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.protect_profile_role()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.role is distinct from new.role and not public.is_admin() then raise exception 'Only an administrator can change roles'; end if;
  new.updated_at=now(); return new;
end;
$$;

drop trigger if exists protect_profile_role_trigger on public.profiles;
create trigger protect_profile_role_trigger before update on public.profiles for each row execute procedure public.protect_profile_role();

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(), slug text not null unique, name text not null,
  short_name text not null, sort_order integer not null default 0, year13_priority text,
  resource_path text, created_at timestamptz not null default now()
);

insert into public.subjects (slug,name,short_name,sort_order,year13_priority,resource_path) values
('sociology','WJEC A Level Sociology','Sociology',1,'Units 3 and 4','subjects/sociology/README.md'),
('law','WJEC A Level Law','Law',2,'Units 3 and 4','subjects/law/README.md'),
('history','WJEC A Level History','History',3,'Unit 3 Option 8, Unit 4 Option 3 and Unit 5 NEA','subjects/history/README.md'),
('welsh-bacc','WJEC Level 3 Advanced Skills Baccalaureate Wales','Welsh Bacc',4,'Individual Project','subjects/advanced-skills-baccalaureate/README.md')
on conflict (slug) do update set name=excluded.name,short_name=excluded.short_name,sort_order=excluded.sort_order,year13_priority=excluded.year13_priority,resource_path=excluded.resource_path;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  subject_slug text references public.subjects(slug) on update cascade, title text not null, description text,
  due_at timestamptz, status text not null default 'not_started' check(status in ('not_started','started','nearly_finished','feedback','completed')),
  priority integer not null default 2 check(priority between 1 and 3), estimated_minutes integer,
  next_action text, assessed boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.task_steps (
  id uuid primary key default gen_random_uuid(), task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, title text not null, order_index integer not null default 0,
  completed boolean not null default false, estimated_minutes integer, created_at timestamptz not null default now(), completed_at timestamptz
);
create table if not exists public.task_notes (
  id uuid primary key default gen_random_uuid(), task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, note text not null,
  note_type text not null default 'note' check(note_type in ('note','teacher_feedback','reflection')), created_at timestamptz not null default now()
);
create table if not exists public.planner_events (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, category text not null default 'personal' check(category in ('school','work','revision','activity','ucas','university','personal','travel')),
  subject_slug text references public.subjects(slug) on update cascade, starts_at timestamptz not null, ends_at timestamptz,
  location text, notes text, created_at timestamptz not null default now()
);
create table if not exists public.timetable_entries (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  day_of_week integer not null check(day_of_week between 1 and 7), start_time time not null, end_time time not null,
  label text not null, subject_slug text references public.subjects(slug) on update cascade,
  entry_type text not null default 'lesson' check(entry_type in ('registration','lesson','free','break','lunch','other')),
  room text, sort_order integer not null default 0, created_at timestamptz not null default now()
);
create table if not exists public.travel_entries (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  direction text not null check(direction in ('to_school','from_school','other')), sequence integer not null default 1,
  depart_time time, arrive_time time, origin text not null, destination text not null, service text, details text,
  active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.evidence_bank (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, category text not null default 'other', event_date date, description text, what_learned text,
  skills text[], useful_for text[], created_at timestamptz not null default now()
);
create table if not exists public.university_choices (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  university_name text not null, course_name text, course_code text, campus text,
  status text not null default 'researching' check(status in ('researching','shortlist','favourite','not_for_me','applied')),
  favourite boolean not null default false, notes text, pros text[], considerations text[], last_checked_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists public.practice_records (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  subject_slug text references public.subjects(slug) on update cascade, title text not null,
  practice_type text not null default 'practice' check(practice_type in ('knowledge_check','essay','source_question','mock','recall','other')),
  score numeric, score_out_of numeric, reflection text, completed_at timestamptz not null default now(), created_at timestamptz not null default now()
);
create table if not exists public.independent_skills (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  category text not null, skill text not null, status text not null default 'to_learn' check(status in ('to_learn','practising','confident')),
  notes text, updated_at timestamptz not null default now(), unique(user_id,category,skill)
);
create table if not exists public.quick_capture (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  capture_type text not null default 'text' check(capture_type in ('text','link','file','image')), title text, content text,
  source_url text, subject_slug text references public.subjects(slug) on update cascade, processed boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.user_files (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null, subject_slug text references public.subjects(slug) on update cascade,
  storage_path text not null, original_name text not null, mime_type text, size_bytes bigint,
  file_type text not null default 'other' check(file_type in ('assignment_brief','worksheet','teacher_feedback','draft','notes','image','other')),
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at=now(); return new; end; $$;
drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at before update on public.tasks for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.tasks enable row level security;
alter table public.task_steps enable row level security;
alter table public.task_notes enable row level security;
alter table public.planner_events enable row level security;
alter table public.timetable_entries enable row level security;
alter table public.travel_entries enable row level security;
alter table public.evidence_bank enable row level security;
alter table public.university_choices enable row level security;
alter table public.practice_records enable row level security;
alter table public.independent_skills enable row level security;
alter table public.quick_capture enable row level security;
alter table public.user_files enable row level security;

create policy "subjects_read" on public.subjects for select to anon,authenticated using(true);
create policy "profiles_self_or_admin_read" on public.profiles for select to authenticated using(id=(select auth.uid()) or public.is_admin());
create policy "profiles_self_insert" on public.profiles for insert to authenticated with check(id=(select auth.uid()));
create policy "profiles_self_or_admin_update" on public.profiles for update to authenticated using(id=(select auth.uid()) or public.is_admin()) with check(id=(select auth.uid()) or public.is_admin());
create policy "tasks_owner_or_admin" on public.tasks for all to authenticated using(user_id=(select auth.uid()) or public.is_admin()) with check(user_id=(select auth.uid()) or public.is_admin());
create policy "task_steps_owner_or_admin" on public.task_steps for all to authenticated using(user_id=(select auth.uid()) or public.is_admin()) with check(user_id=(select auth.uid()) or public.is_admin());
create policy "task_notes_owner_or_admin" on public.task_notes for all to authenticated using(user_id=(select auth.uid()) or public.is_admin()) with check(user_id=(select auth.uid()) or public.is_admin());
create policy "planner_events_owner_or_admin" on public.planner_events for all to authenticated using(user_id=(select auth.uid()) or public.is_admin()) with check(user_id=(select auth.uid()) or public.is_admin());
create policy "timetable_owner_or_admin" on public.timetable_entries for all to authenticated using(user_id=(select auth.uid()) or public.is_admin()) with check(user_id=(select auth.uid()) or public.is_admin());
create policy "travel_owner_or_admin" on public.travel_entries for all to authenticated using(user_id=(select auth.uid()) or public.is_admin()) with check(user_id=(select auth.uid()) or public.is_admin());
create policy "evidence_owner_or_admin" on public.evidence_bank for all to authenticated using(user_id=(select auth.uid()) or public.is_admin()) with check(user_id=(select auth.uid()) or public.is_admin());
create policy "universities_owner_or_admin" on public.university_choices for all to authenticated using(user_id=(select auth.uid()) or public.is_admin()) with check(user_id=(select auth.uid()) or public.is_admin());
create policy "practice_owner_or_admin" on public.practice_records for all to authenticated using(user_id=(select auth.uid()) or public.is_admin()) with check(user_id=(select auth.uid()) or public.is_admin());
create policy "skills_owner_or_admin" on public.independent_skills for all to authenticated using(user_id=(select auth.uid()) or public.is_admin()) with check(user_id=(select auth.uid()) or public.is_admin());
create policy "capture_owner_or_admin" on public.quick_capture for all to authenticated using(user_id=(select auth.uid()) or public.is_admin()) with check(user_id=(select auth.uid()) or public.is_admin());
create policy "files_owner_or_admin" on public.user_files for all to authenticated using(user_id=(select auth.uid()) or public.is_admin()) with check(user_id=(select auth.uid()) or public.is_admin());

insert into storage.buckets(id,name,public,file_size_limit) values('user-files','user-files',false,10485760)
on conflict(id) do update set public=false,file_size_limit=10485760;
create policy "user_files_storage_read" on storage.objects for select to authenticated using(bucket_id='user-files' and ((storage.foldername(name))[1]=(select auth.uid())::text or public.is_admin()));
create policy "user_files_storage_insert" on storage.objects for insert to authenticated with check(bucket_id='user-files' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "user_files_storage_update" on storage.objects for update to authenticated using(bucket_id='user-files' and ((storage.foldername(name))[1]=(select auth.uid())::text or public.is_admin())) with check(bucket_id='user-files' and ((storage.foldername(name))[1]=(select auth.uid())::text or public.is_admin()));
create policy "user_files_storage_delete" on storage.objects for delete to authenticated using(bucket_id='user-files' and ((storage.foldername(name))[1]=(select auth.uid())::text or public.is_admin()));

revoke execute on function public.handle_new_user() from public,anon,authenticated;
revoke execute on function public.protect_profile_role() from public,anon,authenticated;
revoke execute on function public.is_admin() from public,anon;
grant execute on function public.is_admin() to authenticated;
