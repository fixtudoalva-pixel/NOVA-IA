create policy "members update knowledge" on public.knowledge_items for update using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "members update conversations" on public.conversations for update using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "members update actions" on public.actions for update using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "members update approvals" on public.approvals for update using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
