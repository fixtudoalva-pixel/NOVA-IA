create or replace function public.create_organization(
  organization_name text,
  organization_locale text default 'pt-PT',
  organization_currency text default 'EUR'
) returns uuid
language plpgsql
security definer
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
end;
$$;

revoke all on function public.create_organization(text,text,text) from public;
revoke all on function public.create_organization(text,text,text) from anon;
grant execute on function public.create_organization(text,text,text) to authenticated;

create policy "members insert contacts" on public.contacts for insert with check (public.is_org_member(organization_id));
create policy "members insert goals" on public.goals for insert with check (public.is_org_member(organization_id));
create policy "members insert knowledge" on public.knowledge_items for insert with check (public.is_org_member(organization_id));
create policy "members insert conversations" on public.conversations for insert with check (public.is_org_member(organization_id));
create policy "members insert messages" on public.messages for insert with check (public.is_org_member(organization_id));
create policy "members insert actions" on public.actions for insert with check (public.is_org_member(organization_id));
create policy "members insert approvals" on public.approvals for insert with check (public.is_org_member(organization_id));
create policy "members insert outcomes" on public.outcomes for insert with check (public.is_org_member(organization_id));
create policy "members insert agent runs" on public.agent_runs for insert with check (public.is_org_member(organization_id));
