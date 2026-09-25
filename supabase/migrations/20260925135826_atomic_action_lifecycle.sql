create unique index if not exists outcomes_one_execution_per_action_idx
on public.outcomes(action_id) where evidence->>'source' = 'simulator';

create or replace function public.execute_approved_action(p_action_id uuid)
returns void language plpgsql security invoker set search_path=public as $$
declare v_action public.actions%rowtype; v_completed timestamptz := now();
begin
  select * into v_action from public.actions
  where id=p_action_id and status='approved' and public.is_org_member(organization_id)
  for update;
  if not found then return; end if;
  update public.actions set status='completed', completed_at=v_completed,
    output=jsonb_build_object('executor','simulator','completed_at',v_completed)
  where id=v_action.id;
  insert into public.outcomes(organization_id,action_id,kind,attribution,evidence)
  values(v_action.organization_id,v_action.id,
    case when v_action.action_type='propose_booking' then 'booking'::public.outcome_kind else 'other'::public.outcome_kind end,
    'assisted',jsonb_build_object('source','simulator'));
end $$;

revoke all on function public.execute_approved_action(uuid) from public,anon;
grant execute on function public.execute_approved_action(uuid) to authenticated;

create or replace function public.decide_approval(p_approval_id uuid,p_action_id uuid,p_decision text)
returns void language plpgsql security invoker set search_path=public as $$
declare v_org uuid; v_user uuid := auth.uid();
begin
 if v_user is null then raise exception 'authentication required'; end if;
 if p_decision not in ('approved','rejected') then raise exception 'invalid decision'; end if;
 select organization_id into v_org from public.approvals
 where id=p_approval_id and action_id=p_action_id and decision is null and public.is_org_member(organization_id)
 for update;
 if not found then return; end if;
 update public.actions set status=case when p_decision='approved' then 'approved'::public.action_status else 'cancelled'::public.action_status end
 where id=p_action_id and organization_id=v_org and status='awaiting_approval';
 if not found then return; end if;
 update public.approvals set decision=p_decision,decided_by=v_user,decided_at=now()
 where id=p_approval_id and organization_id=v_org and decision is null;
end $$;

revoke all on function public.decide_approval(uuid,uuid,text) from public,anon;
grant execute on function public.decide_approval(uuid,uuid,text) to authenticated;
