drop policy if exists "self bootstrap membership" on public.organization_members;

create or replace function public.bootstrap_organization_owner()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  insert into public.organization_members(organization_id,user_id,role)
  values (new.id,auth.uid(),'owner');
  return new;
end; $$;

revoke all on function public.bootstrap_organization_owner() from public, anon, authenticated;

drop trigger if exists bootstrap_organization_owner_trigger on public.organizations;
create trigger bootstrap_organization_owner_trigger
after insert on public.organizations for each row execute function public.bootstrap_organization_owner();

create or replace function public.create_organization(
  organization_name text,
  organization_locale text default 'pt-PT',
  organization_currency text default 'EUR'
) returns uuid language plpgsql security invoker set search_path=public as $$
declare new_id uuid;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if length(trim(organization_name)) < 2 then raise exception 'invalid organization name'; end if;
  insert into public.organizations(name,locale,currency)
  values(trim(organization_name),organization_locale,upper(organization_currency))
  returning id into new_id;
  return new_id;
end; $$;
