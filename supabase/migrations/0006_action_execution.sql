alter table public.actions add column if not exists conversation_id uuid references public.conversations(id) on delete set null;
create index if not exists actions_conversation_id_idx on public.actions(conversation_id);

create policy "members update outcomes" on public.outcomes
for update using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));
