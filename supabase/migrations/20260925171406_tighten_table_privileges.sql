revoke all on table public.actions,public.agent_runs,public.approvals,public.contacts,public.conversations,public.goals,public.knowledge_items,public.messages,public.organization_members,public.organizations,public.outcomes from anon;
grant select on table public.actions,public.agent_runs,public.approvals,public.contacts,public.conversations,public.goals,public.knowledge_items,public.messages,public.organization_members,public.organizations,public.outcomes to authenticated;
grant insert,update on table public.actions,public.approvals,public.conversations,public.knowledge_items to authenticated;
grant insert on table public.agent_runs,public.contacts,public.goals,public.messages,public.outcomes,public.organizations to authenticated;
