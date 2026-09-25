create or replace function public.create_organization(
 organization_name text, organization_locale text default 'pt-PT', organization_currency text default 'EUR'
) returns uuid language plpgsql security invoker set search_path=public as $$
declare new_id uuid; v_name text:=regexp_replace(trim(organization_name),'[[:space:]]+',' ','g');
begin
 if auth.uid() is null then raise exception 'authentication required'; end if;
 if exists(select 1 from public.organization_members where user_id=auth.uid()) then raise exception 'organization already exists'; end if;
 if length(v_name)<2 or length(v_name)>120 then raise exception 'invalid organization name'; end if;
 if organization_locale <> 'pt-PT' then raise exception 'unsupported locale'; end if;
 if upper(organization_currency) <> 'EUR' then raise exception 'unsupported currency'; end if;
 insert into public.organizations(name,locale,currency) values(v_name,'pt-PT','EUR') returning id into new_id;
 return new_id;
end $$;
revoke all on function public.create_organization(text,text,text) from public,anon;
grant execute on function public.create_organization(text,text,text) to authenticated;
