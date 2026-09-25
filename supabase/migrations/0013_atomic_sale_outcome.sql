-- Record one human-confirmed sale per completed action, atomically and idempotently.
create unique index if not exists outcomes_one_human_sale_per_action_idx
on public.outcomes(action_id)
where kind = 'sale' and evidence->>'source' = 'human_confirmation';

create or replace function public.record_sale_outcome(p_action_id uuid, p_revenue_minor bigint)
returns void
language plpgsql
security invoker
set search_path=public
as $$
declare v_action public.actions%rowtype;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if p_revenue_minor is null or p_revenue_minor <= 0 then raise exception 'invalid revenue'; end if;

  select * into v_action from public.actions
  where id=p_action_id and status='completed' and public.is_org_member(organization_id)
  for update;
  if not found then raise exception 'completed action not found'; end if;

  insert into public.outcomes(organization_id,action_id,kind,revenue_minor,attribution,evidence)
  values(v_action.organization_id,v_action.id,'sale',p_revenue_minor,'assisted',
    jsonb_build_object('source','human_confirmation','confirmed_by',auth.uid()))
  on conflict (action_id) where kind='sale' and evidence->>'source'='human_confirmation'
  do update set revenue_minor=excluded.revenue_minor,attribution=excluded.attribution,evidence=excluded.evidence;
end $$;

revoke all on function public.record_sale_outcome(uuid,bigint) from public,anon;
grant execute on function public.record_sale_outcome(uuid,bigint) to authenticated;
