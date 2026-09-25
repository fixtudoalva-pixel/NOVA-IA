create or replace function public.create_organization(
  organization_name text,
  organization_locale text default 'pt-PT',
  organization_currency text default 'EUR'
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare new_id uuid;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if length(trim(organization_name)) < 2 then raise exception 'invalid organization name'; end if;
  insert into public.organizations(name, locale, currency)
  values (trim(organization_name), organization_locale, upper(organization_currency))
  returning id into new_id;
  insert into public.organization_members(organization_id, user_id, role)
  values (new_id, auth.uid(), 'owner');
  return new_id;
end; $$;

create policy "authenticated create organizations" on public.organizations
for insert to authenticated with check (auth.uid() is not null);

create policy "self bootstrap membership" on public.organization_members
for insert to authenticated with check (user_id = auth.uid());

revoke all on function public.create_organization(text,text,text) from public;
revoke all on function public.create_organization(text,text,text) from anon;
grant execute on function public.create_organization(text,text,text) to authenticated;
