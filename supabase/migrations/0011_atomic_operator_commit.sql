-- Atomically persist one Operator decision, its proposed actions, approvals and reply.
-- Duplicate execution for the same customer message returns the existing completed run.
create or replace function public.commit_operator_decision(
 p_conversation_id uuid,p_message_created_at timestamptz,p_decision jsonb,p_actions jsonb
) returns uuid language plpgsql security invoker set search_path=public as $$
declare v_org uuid; v_run uuid; v_action jsonb; v_action_id uuid; v_requires boolean;
begin
 if auth.uid() is null then raise exception 'authentication required'; end if;
 select organization_id into v_org from public.conversations
 where id=p_conversation_id and public.is_org_member(organization_id) for update;
 if v_org is null then raise exception 'conversation not found'; end if;
 if exists(select 1 from public.agent_runs where conversation_id=p_conversation_id and input->>'message_created_at'=p_message_created_at::text and status='completed') then
   select id into v_run from public.agent_runs where conversation_id=p_conversation_id and input->>'message_created_at'=p_message_created_at::text and status='completed' order by created_at desc limit 1;
   return v_run;
 end if;
 insert into public.agent_runs(organization_id,conversation_id,model_provider,model_name,status,input,output,started_at,completed_at)
 values(v_org,p_conversation_id,'deterministic','operator-v0','completed',jsonb_build_object('message_created_at',p_message_created_at),p_decision,now(),now()) returning id into v_run;
 for v_action in select value from jsonb_array_elements(coalesce(p_actions,'[]'::jsonb)) loop
   v_requires=coalesce((v_action->>'requiresApproval')::boolean,true);
   insert into public.actions(organization_id,conversation_id,action_type,status,risk,rationale,input)
   values(v_org,p_conversation_id,v_action->>'type',case when v_requires then 'awaiting_approval'::public.action_status else 'approved'::public.action_status end,
     coalesce(v_action->>'risk','medium'),v_action->>'rationale',coalesce(v_action->'payload','{}'::jsonb)||jsonb_build_object('agent_run_id',v_run))
   returning id into v_action_id;
   if v_requires then insert into public.approvals(organization_id,action_id,requested_by) values(v_org,v_action_id,'agent'); end if;
 end loop;
 insert into public.messages(organization_id,conversation_id,direction,actor,body,metadata)
 values(v_org,p_conversation_id,'outbound','agent',coalesce(p_decision->>'reply',''),
 jsonb_build_object('confidence',p_decision->'confidence','intent',p_decision->'intent','agent_run_id',v_run));
 return v_run;
end $$;
revoke all on function public.commit_operator_decision(uuid,timestamptz,jsonb,jsonb) from public,anon;
grant execute on function public.commit_operator_decision(uuid,timestamptz,jsonb,jsonb) to authenticated;
create unique index if not exists agent_runs_one_completed_per_message_idx
on public.agent_runs(conversation_id,(input->>'message_created_at')) where status='completed';
