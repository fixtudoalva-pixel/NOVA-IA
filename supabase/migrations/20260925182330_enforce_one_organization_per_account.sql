create unique index if not exists organization_members_one_org_per_user_idx
on public.organization_members (user_id);

create or replace function public.bootstrap_organization_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;
  if exists (
    select 1 from public.organization_members
    where user_id = auth.uid()
  ) then
    raise exception 'organization already exists';
  end if;
  insert into public.organization_members (organization_id, user_id, role)
  values (new.id, auth.uid(), 'owner');
  return new;
end;
$$;
