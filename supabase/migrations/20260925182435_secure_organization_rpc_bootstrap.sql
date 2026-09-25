alter function public.create_organization(text,text,text) security definer;
alter function public.create_organization(text,text,text) set search_path = '';
revoke insert on public.organizations from authenticated;
