revoke insert,update,delete,truncate on public.actions,public.approvals,public.outcomes,public.agent_runs from anon,authenticated;
revoke insert,update,delete,truncate on public.messages from anon,authenticated;
grant select on public.actions,public.approvals,public.outcomes,public.agent_runs,public.messages to authenticated;
