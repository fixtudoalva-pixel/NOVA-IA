-- Membership creation is owned by controlled onboarding workflows, never direct browser inserts.
revoke insert on table public.organization_members from authenticated;
