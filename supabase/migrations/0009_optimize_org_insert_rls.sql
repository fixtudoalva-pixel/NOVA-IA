drop policy if exists "authenticated create organizations" on public.organizations;
create policy "authenticated create organizations" on public.organizations
for insert to authenticated with check ((select auth.uid()) is not null);
