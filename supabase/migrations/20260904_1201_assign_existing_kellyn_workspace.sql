-- One-time assignment for the existing Kellyn Hub accounts.
-- No account IDs or email addresses are stored in source control.

alter table public.profiles disable trigger protect_profile_role_trigger;

with owner as (
  select id
  from public.profiles
  where role='admin'
  order by created_at
  limit 1
)
update public.profiles p
set workspace_owner_id = case
  when p.role='admin' then p.id
  else (select id from owner)
end
where p.role in ('admin','student');

alter table public.profiles enable trigger protect_profile_role_trigger;
