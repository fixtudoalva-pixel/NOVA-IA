-- Keep tenant RLS policies unavailable to anon at the policy-role layer.
-- is_org_member remains the tenant boundary; this narrows policy applicability to signed-in users.
alter policy "members read actions" on public.actions to authenticated;
alter policy "members read agent runs" on public.agent_runs to authenticated;
alter policy "members read approvals" on public.approvals to authenticated;
alter policy "members insert contacts" on public.contacts to authenticated;
alter policy "members read contacts" on public.contacts to authenticated;
alter policy "members insert conversations" on public.conversations to authenticated;
alter policy "members read conversations" on public.conversations to authenticated;
alter policy "members update conversations" on public.conversations to authenticated;
alter policy "members insert goals" on public.goals to authenticated;
alter policy "members read goals" on public.goals to authenticated;
alter policy "members insert knowledge" on public.knowledge_items to authenticated;
alter policy "members read knowledge" on public.knowledge_items to authenticated;
alter policy "members update knowledge" on public.knowledge_items to authenticated;
alter policy "members read messages" on public.messages to authenticated;
alter policy "members read memberships" on public.organization_members to authenticated;
alter policy "members read organizations" on public.organizations to authenticated;
alter policy "members read outcomes" on public.outcomes to authenticated;
