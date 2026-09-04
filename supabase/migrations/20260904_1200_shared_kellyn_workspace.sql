-- Shared Kellyn workspace
-- Account preferences stay on the signed-in profile, while learning/organisation data can be shared by authorised workspace members.

alter table public.profiles
  add column if not exists workspace_owner_id uuid references auth.users(id) on delete set null;

update public.profiles set workspace_owner_id=id where workspace_owner_id is null;

create or replace function public.can_access_user_data(owner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select owner_id = (select auth.uid())
    or public.is_admin()
    or exists (
      select 1
      from public.profiles me
      where me.id = (select auth.uid())
        and coalesce(me.workspace_owner_id, me.id) = owner_id
    );
$$;

create or replace function public.can_access_storage_owner(owner_text text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select owner_text = (select auth.uid())::text
    or public.is_admin()
    or exists (
      select 1
      from public.profiles me
      where me.id = (select auth.uid())
        and coalesce(me.workspace_owner_id, me.id)::text = owner_text
    );
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, workspace_owner_id)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)), new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.protect_profile_role()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.role is distinct from new.role and not public.is_admin() then
    raise exception 'Only an administrator can change roles';
  end if;
  if old.workspace_owner_id is distinct from new.workspace_owner_id and not public.is_admin() then
    raise exception 'Only an administrator can change workspace membership';
  end if;
  new.updated_at=now();
  return new;
end;
$$;

create policy "shared_workspace_tasks" on public.tasks for all to authenticated using(public.can_access_user_data(user_id)) with check(public.can_access_user_data(user_id));
create policy "shared_workspace_task_steps" on public.task_steps for all to authenticated using(public.can_access_user_data(user_id)) with check(public.can_access_user_data(user_id));
create policy "shared_workspace_task_notes" on public.task_notes for all to authenticated using(public.can_access_user_data(user_id)) with check(public.can_access_user_data(user_id));
create policy "shared_workspace_planner_events" on public.planner_events for all to authenticated using(public.can_access_user_data(user_id)) with check(public.can_access_user_data(user_id));
create policy "shared_workspace_timetable_entries" on public.timetable_entries for all to authenticated using(public.can_access_user_data(user_id)) with check(public.can_access_user_data(user_id));
create policy "shared_workspace_travel_entries" on public.travel_entries for all to authenticated using(public.can_access_user_data(user_id)) with check(public.can_access_user_data(user_id));
create policy "shared_workspace_evidence_bank" on public.evidence_bank for all to authenticated using(public.can_access_user_data(user_id)) with check(public.can_access_user_data(user_id));
create policy "shared_workspace_university_choices" on public.university_choices for all to authenticated using(public.can_access_user_data(user_id)) with check(public.can_access_user_data(user_id));
create policy "shared_workspace_practice_records" on public.practice_records for all to authenticated using(public.can_access_user_data(user_id)) with check(public.can_access_user_data(user_id));
create policy "shared_workspace_independent_skills" on public.independent_skills for all to authenticated using(public.can_access_user_data(user_id)) with check(public.can_access_user_data(user_id));
create policy "shared_workspace_quick_capture" on public.quick_capture for all to authenticated using(public.can_access_user_data(user_id)) with check(public.can_access_user_data(user_id));
create policy "shared_workspace_user_files" on public.user_files for all to authenticated using(public.can_access_user_data(user_id)) with check(public.can_access_user_data(user_id));
create policy "shared_workspace_learning_progress" on public.learning_progress for all to authenticated using(public.can_access_user_data(user_id)) with check(public.can_access_user_data(user_id));
create policy "shared_workspace_notebook_links" on public.notebook_links for all to authenticated using(public.can_access_user_data(user_id)) with check(public.can_access_user_data(user_id));
create policy "shared_workspace_revision_recommendations" on public.revision_recommendations for all to authenticated using(public.can_access_user_data(user_id)) with check(public.can_access_user_data(user_id));
create policy "shared_workspace_library_items" on public.library_items for all to authenticated using(public.can_access_user_data(user_id)) with check(public.can_access_user_data(user_id));
create policy "shared_workspace_library_chunks" on public.library_chunks for all to authenticated using(public.can_access_user_data(user_id)) with check(public.can_access_user_data(user_id));
create policy "shared_workspace_feedback_targets" on public.feedback_targets for all to authenticated using(public.can_access_user_data(user_id)) with check(public.can_access_user_data(user_id));

create policy "shared_workspace_storage_read" on storage.objects for select to authenticated using(bucket_id='user-files' and public.can_access_storage_owner((storage.foldername(name))[1]));
create policy "shared_workspace_storage_insert" on storage.objects for insert to authenticated with check(bucket_id='user-files' and public.can_access_storage_owner((storage.foldername(name))[1]));
create policy "shared_workspace_storage_update" on storage.objects for update to authenticated using(bucket_id='user-files' and public.can_access_storage_owner((storage.foldername(name))[1])) with check(bucket_id='user-files' and public.can_access_storage_owner((storage.foldername(name))[1]));
create policy "shared_workspace_storage_delete" on storage.objects for delete to authenticated using(bucket_id='user-files' and public.can_access_storage_owner((storage.foldername(name))[1]));

revoke execute on function public.can_access_user_data(uuid) from public,anon;
revoke execute on function public.can_access_storage_owner(text) from public,anon;
grant execute on function public.can_access_user_data(uuid) to authenticated;
grant execute on function public.can_access_storage_owner(text) to authenticated;
