alter function public.commit_operator_decision(uuid,uuid,jsonb,jsonb) security definer;
alter function public.decide_approval(uuid,uuid,text) security definer;
alter function public.execute_approved_action(uuid) security definer;
alter function public.record_sale_outcome(uuid,bigint) security definer;
alter function public.simulate_inbound(text,text) security definer;
revoke all on function public.commit_operator_decision(uuid,uuid,jsonb,jsonb),public.decide_approval(uuid,uuid,text),public.execute_approved_action(uuid),public.record_sale_outcome(uuid,bigint),public.simulate_inbound(text,text) from public,anon;
grant execute on function public.commit_operator_decision(uuid,uuid,jsonb,jsonb),public.decide_approval(uuid,uuid,text),public.execute_approved_action(uuid),public.record_sale_outcome(uuid,bigint),public.simulate_inbound(text,text) to authenticated;
