create unique index if not exists outcomes_one_simulator_result_per_action_idx on public.outcomes(action_id) where evidence->>'source'='simulator';
create or replace function public.execute_approved_action(p_action_id uuid)
returns void language plpgsql security invoker set search_path=public as $$
declare v_action public.actions%rowtype; v_completed timestamptz:=now();
begin
 if auth.uid() is null then raise exception 'authentication required'; end if;
 select * into v_action from public.actions where id=p_action_id and status='approved' and public.is_org_member(organization_id) for update;
 if not found then return; end if;
 update public.actions set status='completed',completed_at=v_completed,output=jsonb_build_object('executor','simulator','completed_at',v_completed) where id=v_action.id;
 insert into public.outcomes(organization_id,action_id,kind,attribution,evidence)
 values(v_action.organization_id,v_action.id,case when v_action.action_type='propose_booking' then 'booking'::public.outcome_kind else 'other'::public.outcome_kind end,'assisted',jsonb_build_object('source','simulator'))
 on conflict (action_id) where evidence->>'source'='simulator' do nothing;
end $$;
