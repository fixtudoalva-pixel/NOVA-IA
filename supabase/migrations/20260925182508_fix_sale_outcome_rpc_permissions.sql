alter function public.record_sale_outcome(uuid,bigint) security definer;
alter function public.record_sale_outcome(uuid,bigint) set search_path = '';
revoke all on function public.record_sale_outcome(uuid,bigint) from public, anon;
grant execute on function public.record_sale_outcome(uuid,bigint) to authenticated;
