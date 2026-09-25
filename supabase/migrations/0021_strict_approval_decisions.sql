-- Do not silently report success when an approval transition did not occur.
create or replace function public.decide_approval(p_approval_id uuid,p_action_id uuid,p_decision text)
returns void language plpgsql security invoker set search_path=public as $$
declare v_org uuid; v_user uuid:=auth.uid();
begin
 if v_user is null then raise exception 'authentication required'; end if;
 if p_decision not in ('approved','rejected') then raise exception 'invalid decision'; end if;
 select organization_id into v_org from public.approvals where id=p_approval_id and action_id=p_action_id and decision is null and public.is_org_member(organization_id) for update;
 if not found then raise exception 'pending approval not found'; end if;
 update public.actions set status=case when p_decision='approved' then 'approved'::public.action_status else 'cancelled'::public.action_status end where id=p_action_id and organization_id=v_org and status='awaiting_approval';
 if not found then raise exception 'awaiting action not found'; end if;
 update public.approvals set decision=p_decision,decided_by=v_user,decided_at=now() where id=p_approval_id and organization_id=v_org and decision is null;
 if not found then raise exception 'approval already decided'; end if;
end $$;
