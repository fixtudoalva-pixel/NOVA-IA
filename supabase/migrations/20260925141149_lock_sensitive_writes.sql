drop policy if exists "members insert actions" on public.actions;
drop policy if exists "members update actions" on public.actions;
drop policy if exists "members insert approvals" on public.approvals;
drop policy if exists "members update approvals" on public.approvals;
drop policy if exists "members insert outcomes" on public.outcomes;
drop policy if exists "members update outcomes" on public.outcomes;
drop policy if exists "members insert agent runs" on public.agent_runs;
drop policy if exists "members insert messages" on public.messages;

create or replace function public.commit_operator_decision(
 p_conversation_id uuid,p_message_created_at timestamptz,p_decision jsonb,p_actions jsonb
) returns uuid language plpgsql security definer set search_path=public as $$
declare v_org uuid; v_run uuid; v_action jsonb; v_action_id uuid; v_requires boolean;
begin
 if auth.uid() is null then raise exception 'authentication required'; end if;
 select organization_id into v_org from public.conversations
 where id=p_conversation_id and public.is_org_member(organization_id) for update;
 if v_org is null then raise exception 'conversation not found'; end if;
 select id into v_run from public.agent_runs where conversation_id=p_conversation_id and input->>'message_created_at'=p_message_created_at::text and status='completed' order by created_at desc limit 1;
 if v_run is not null then return v_run; end if;
 insert into public.agent_runs(organization_id,conversation_id,model_provider,model_name,status,input,output,started_at,completed_at)
 values(v_org,p_conversation_id,'deterministic','operator-v0','completed',jsonb_build_object('message_created_at',p_message_created_at),p_decision,now(),now()) returning id into v_run;
 for v_action in select value from jsonb_array_elements(coalesce(p_actions,'[]'::jsonb)) loop
  v_requires=coalesce((v_action->>'requiresApproval')::boolean,true);
  insert into public.actions(organization_id,conversation_id,action_type,status,risk,rationale,input)
  values(v_org,p_conversation_id,v_action->>'type',case when v_requires then 'awaiting_approval'::public.action_status else 'approved'::public.action_status end,coalesce(v_action->>'risk','medium'),v_action->>'rationale',coalesce(v_action->'payload','{}'::jsonb)||jsonb_build_object('agent_run_id',v_run)) returning id into v_action_id;
  if v_requires then insert into public.approvals(organization_id,action_id,requested_by) values(v_org,v_action_id,'agent'); end if;
 end loop;
 insert into public.messages(organization_id,conversation_id,direction,actor,body,metadata)
 values(v_org,p_conversation_id,'outbound','agent',coalesce(p_decision->>'reply',''),jsonb_build_object('confidence',p_decision->'confidence','intent',p_decision->'intent','agent_run_id',v_run));
 return v_run;
end $$;

create or replace function public.decide_approval(p_approval_id uuid,p_action_id uuid,p_decision text)
returns void language plpgsql security definer set search_path=public as $$
declare v_org uuid; v_user uuid:=auth.uid();
begin
 if v_user is null then raise exception 'authentication required'; end if;
 if p_decision not in ('approved','rejected') then raise exception 'invalid decision'; end if;
 select organization_id into v_org from public.approvals where id=p_approval_id and action_id=p_action_id and decision is null and public.is_org_member(organization_id) for update;
 if not found then return; end if;
 update public.actions set status=case when p_decision='approved' then 'approved'::public.action_status else 'cancelled'::public.action_status end where id=p_action_id and organization_id=v_org and status='awaiting_approval';
 if not found then return; end if;
 update public.approvals set decision=p_decision,decided_by=v_user,decided_at=now() where id=p_approval_id and organization_id=v_org and decision is null;
end $$;

create or replace function public.execute_approved_action(p_action_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare v_action public.actions%rowtype; v_completed timestamptz:=now();
begin
 if auth.uid() is null then raise exception 'authentication required'; end if;
 select * into v_action from public.actions where id=p_action_id and status='approved' and public.is_org_member(organization_id) for update;
 if not found then return; end if;
 update public.actions set status='completed',completed_at=v_completed,output=jsonb_build_object('executor','simulator','completed_at',v_completed) where id=v_action.id;
 insert into public.outcomes(organization_id,action_id,kind,attribution,evidence) values(v_action.organization_id,v_action.id,case when v_action.action_type='propose_booking' then 'booking'::public.outcome_kind else 'other'::public.outcome_kind end,'assisted',jsonb_build_object('source','simulator'));
end $$;

revoke all on function public.commit_operator_decision(uuid,timestamptz,jsonb,jsonb) from public,anon;
revoke all on function public.decide_approval(uuid,uuid,text) from public,anon;
revoke all on function public.execute_approved_action(uuid) from public,anon;
grant execute on function public.commit_operator_decision(uuid,timestamptz,jsonb,jsonb) to authenticated;
grant execute on function public.decide_approval(uuid,uuid,text) to authenticated;
grant execute on function public.execute_approved_action(uuid) to authenticated;
