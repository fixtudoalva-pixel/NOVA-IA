-- Mirror the live database hardening applied before repository migrations caught up.
revoke all on function public.is_org_member(uuid) from public;
revoke all on function public.is_org_member(uuid) from anon;
revoke all on function public.is_org_member(uuid) from authenticated;

create index if not exists organization_members_user_id_idx on public.organization_members(user_id);
create index if not exists contacts_organization_id_idx on public.contacts(organization_id);
create index if not exists goals_organization_id_idx on public.goals(organization_id);
create index if not exists actions_organization_id_idx on public.actions(organization_id);
create index if not exists actions_goal_id_idx on public.actions(goal_id);
create index if not exists actions_contact_id_idx on public.actions(contact_id);
create index if not exists approvals_organization_id_idx on public.approvals(organization_id);
create index if not exists approvals_action_id_idx on public.approvals(action_id);
create index if not exists approvals_decided_by_idx on public.approvals(decided_by);
create index if not exists outcomes_organization_id_idx on public.outcomes(organization_id);
create index if not exists outcomes_action_id_idx on public.outcomes(action_id);
