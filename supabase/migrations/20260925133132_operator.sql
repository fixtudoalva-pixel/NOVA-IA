create type public.message_direction as enum ('inbound','outbound','internal');
create type public.message_actor as enum ('customer','human','agent','system');
create type public.conversation_status as enum ('open','waiting_customer','waiting_human','closed');

create table public.knowledge_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  kind text not null default 'fact',
  title text not null,
  content text not null,
  source text,
  is_approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  channel text not null default 'simulator',
  status public.conversation_status not null default 'open',
  assigned_to text not null default 'agent',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  direction public.message_direction not null,
  actor public.message_actor not null,
  body text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create table public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  goal_id uuid references public.goals(id) on delete set null,
  model_provider text, model_name text,
  status text not null default 'queued',
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  prompt_tokens bigint not null default 0,
  completion_tokens bigint not null default 0,
  cost_minor bigint not null default 0,
  started_at timestamptz, completed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.knowledge_items enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.agent_runs enable row level security;
create policy "members read knowledge" on public.knowledge_items for select using (public.is_org_member(organization_id));
create policy "members read conversations" on public.conversations for select using (public.is_org_member(organization_id));
create policy "members read messages" on public.messages for select using (public.is_org_member(organization_id));
create policy "members read agent runs" on public.agent_runs for select using (public.is_org_member(organization_id));
create index knowledge_items_org_idx on public.knowledge_items(organization_id);
create index conversations_org_idx on public.conversations(organization_id);
create index conversations_contact_idx on public.conversations(contact_id);
create index messages_org_idx on public.messages(organization_id);
create index messages_conversation_idx on public.messages(conversation_id, created_at);
create index agent_runs_org_idx on public.agent_runs(organization_id);
create index agent_runs_conversation_idx on public.agent_runs(conversation_id);
create index agent_runs_goal_idx on public.agent_runs(goal_id);
