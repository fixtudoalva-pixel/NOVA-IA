-- Closed conversations cannot receive a new Operator decision.
create or replace function public.commit_operator_decision(
 p_conversation_id uuid,p_source_message_id uuid,p_decision jsonb,p_actions jsonb
) returns uuid language plpgsql security invoker set search_path=public as $$
declare v_org uuid; v_run uuid; v_action jsonb; v_action_id uuid; v_risk text;
begin
 if auth.uid() is null then raise exception 'authentication required'; end if;
 if jsonb_typeof(p_actions) is distinct from 'array' then raise exception 'invalid actions'; end if;
 if jsonb_typeof(p_decision) is distinct from 'object' then raise exception 'invalid decision'; end if;
 if jsonb_array_length(p_actions)>20 then raise exception 'too many actions'; end if;
 select organization_id into v_org from public.conversations where id=p_conversation_id and status<>'closed' and public.is_org_member(organization_id) for update;
 if v_org is null then raise exception 'conversation not found or closed'; end if;
 if not exists(select 1 from public.messages where id=p_source_message_id and conversation_id=p_conversation_id and organization_id=v_org and actor='customer' and direction='inbound') then raise exception 'invalid source message'; end if;
 select id into v_run from public.agent_runs where conversation_id=p_conversation_id and source_message_id=p_source_message_id and status='completed' limit 1;
 if v_run is not null then return v_run; end if;
 insert into public.agent_runs(organization_id,conversation_id,source_message_id,model_provider,model_name,status,input,output,started_at,completed_at)
 values(v_org,p_conversation_id,p_source_message_id,'deterministic','operator-v0','completed',jsonb_build_object('source_message_id',p_source_message_id),p_decision,now(),now()) returning id into v_run;
 for v_action in select value from jsonb_array_elements(p_actions) loop
  if jsonb_typeof(v_action) is distinct from 'object' then raise exception 'invalid action'; end if;
  if coalesce(length(v_action->>'type'),0)<1 or length(v_action->>'type')>120 then raise exception 'invalid action type'; end if;
  if length(coalesce(v_action->>'rationale',''))>2000 then raise exception 'invalid rationale'; end if;
  if jsonb_typeof(coalesce(v_action->'payload','{}'::jsonb)) is distinct from 'object' then raise exception 'invalid payload'; end if;
  v_risk=coalesce(v_action->>'risk','medium');
  if v_risk not in ('low','medium','high','critical') then raise exception 'invalid action risk'; end if;
  if v_risk='critical' then raise exception 'critical actions are blocked'; end if;
  insert into public.actions(organization_id,conversation_id,action_type,status,risk,rationale,input)
  values(v_org,p_conversation_id,v_action->>'type','awaiting_approval'::public.action_status,v_risk,left(coalesce(v_action->>'rationale',''),2000),coalesce(v_action->'payload','{}'::jsonb)||jsonb_build_object('agent_run_id',v_run)) returning id into v_action_id;
  insert into public.approvals(organization_id,action_id,requested_by) values(v_org,v_action_id,'agent');
 end loop;
 insert into public.messages(organization_id,conversation_id,direction,actor,body,metadata)
 values(v_org,p_conversation_id,'outbound','agent',left(coalesce(p_decision->>'reply',''),10000),jsonb_build_object('confidence',p_decision->'confidence','intent',left(coalesce(p_decision->>'intent','unknown'),120),'agent_run_id',v_run));
 return v_run;
end $$;
revoke all on function public.commit_operator_decision(uuid,uuid,jsonb,jsonb) from public,anon;
grant execute on function public.commit_operator_decision(uuid,uuid,jsonb,jsonb) to authenticated;
