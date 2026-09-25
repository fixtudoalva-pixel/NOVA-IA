alter function public.commit_operator_decision(uuid,uuid,jsonb,jsonb) security invoker;
alter function public.decide_approval(uuid,uuid,text) security invoker;
alter function public.execute_approved_action(uuid) security invoker;
alter function public.record_sale_outcome(uuid,bigint) security invoker;
alter function public.simulate_inbound(text,text) security invoker;
grant insert,update on public.actions,public.approvals to authenticated;
grant insert on public.outcomes,public.agent_runs,public.messages to authenticated;
grant select on public.actions,public.approvals,public.outcomes,public.agent_runs,public.messages to authenticated;
