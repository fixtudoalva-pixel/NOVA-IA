-- Mirror inbound simulator validation at the database trust boundary.
create or replace function public.simulate_inbound(p_name text,p_body text)
returns uuid language plpgsql security invoker set search_path=public as $$
declare v_org uuid; v_contact uuid; v_conversation uuid; v_name text:=regexp_replace(trim(coalesce(p_name,'')),'[[:space:]]+',' ','g'); v_body text:=trim(coalesce(p_body,''));
begin
 if auth.uid() is null then raise exception 'authentication required'; end if;
 if length(v_name)>120 then raise exception 'invalid name'; end if;
 if length(v_body)<2 or length(v_body)>4000 then raise exception 'invalid message'; end if;
 if v_name ~ '[[:cntrl:]]' or v_body ~ '[[:cntrl:]&&[^\n\r\t]]' then raise exception 'invalid control characters'; end if;
 select organization_id into v_org from public.organization_members where user_id=auth.uid() order by created_at limit 1;
 if v_org is null then raise exception 'organization required'; end if;
 insert into public.contacts(organization_id,display_name) values(v_org,nullif(v_name,'')) returning id into v_contact;
 insert into public.conversations(organization_id,contact_id,channel) values(v_org,v_contact,'simulator') returning id into v_conversation;
 insert into public.messages(organization_id,conversation_id,direction,actor,body) values(v_org,v_conversation,'inbound','customer',v_body);
 return v_conversation;
end $$;
revoke all on function public.simulate_inbound(text,text) from public,anon;
grant execute on function public.simulate_inbound(text,text) to authenticated;
