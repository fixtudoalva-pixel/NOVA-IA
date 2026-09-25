create extension if not exists pgcrypto;

create type public.member_role as enum ('owner','admin','operator','viewer');
create type public.action_status as enum ('proposed','awaiting_approval','approved','executing','completed','failed','cancelled');
create type public.outcome_kind as enum ('unknown','reply','booking','sale','lost','other');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  locale text not null default 'pt-PT',
  currency text not null default 'EUR',
  created_at timestamptz not null default now()
);
create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.member_role not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  display_name text, email text, phone text,
  created_at timestamptz not null default now()
);
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null, description text, status text not null default 'active',
  created_at timestamptz not null default now()
);
create table public.actions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  goal_id uuid references public.goals(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  action_type text not null,
  status public.action_status not null default 'proposed',
  risk text not null default 'low',
  rationale text,
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  ai_cost_minor bigint not null default 0 check (ai_cost_minor >= 0),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create table public.approvals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  action_id uuid not null references public.actions(id) on delete cascade,
  requested_by text not null default 'agent',
  decided_by uuid references auth.users(id),
  decision text check (decision in ('approved','rejected')),
  reason text,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create table public.outcomes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  action_id uuid references public.actions(id) on delete set null,
  kind public.outcome_kind not null default 'unknown',
  revenue_minor bigint check (revenue_minor is null or revenue_minor >= 0),
  attribution text not null default 'assisted',
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.contacts enable row level security;
alter table public.goals enable row level security;
alter table public.actions enable row level security;
alter table public.approvals enable row level security;
alter table public.outcomes enable row level security;

create or replace function public.is_org_member(org_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (
  select 1 from public.organization_members m
  where m.organization_id = org_id and m.user_id = auth.uid()
); $$;

create policy "members read organizations" on public.organizations for select using (public.is_org_member(id));
create policy "members read memberships" on public.organization_members for select using (public.is_org_member(organization_id));
create policy "members read contacts" on public.contacts for select using (public.is_org_member(organization_id));
create policy "members read goals" on public.goals for select using (public.is_org_member(organization_id));
create policy "members read actions" on public.actions for select using (public.is_org_member(organization_id));
create policy "members read approvals" on public.approvals for select using (public.is_org_member(organization_id));
create policy "members read outcomes" on public.outcomes for select using (public.is_org_member(organization_id));
