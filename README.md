# NOVA IA

Codename for an AI Business Operator platform for small and medium businesses.

## Mission
Turn business goals into safe, measurable actions. The platform should not be a generic chatbot: it should understand company context, propose and execute work within explicit permissions, and connect actions to auditable outcomes.

## Product principles
- Outcome-first: measure business results, not message volume.
- Earned autonomy: observe -> recommend -> approve -> bounded execution.
- Human control for sensitive actions.
- Multi-tenant and international from day one.
- Provider-agnostic AI orchestration.
- Full action audit trail.
- Privacy and security by default.
- Near-zero fixed cost until product-market evidence exists.

## MVP
The first MVP runs without paid WhatsApp or telephony. It provides a simulated inbox, company knowledge, leads, goals, agent decisions, approval gates, actions, outcomes and an Action Ledger.

Initial laboratory: a repair-service business. The domain model must remain generic enough for other verticals.

## Try the local simulator
Run `npm install` and `npm run dev`, then open `/inbox`. Add an approved business fact and submit a fictional customer message such as “Quanto custa trocar o ecrã?”. Try autonomy levels 0–4 and a message requesting a discount. The decision history stays in browser memory and clears on refresh.

The standalone simulator uses deterministic rules, not a connected AI model. Its replies are never sent to a customer and its state is not saved.

## Authenticated workspace
Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for the NOVA IA Supabase project. The `/login` and `/workspace` routes provide account access, one organization per account, approved knowledge, simulated inbound conversations, decision proposals, approval, simulated execution and an action history. Configure the Supabase Auth site URL and redirect URL for the deployed domain so confirmation emails return to `/workspace`.

The workspace uses database RPCs and row-level security. It does not send real messages or invoke an AI provider. The deterministic operator is a prototype. The files in `supabase/migrations` reproduce the applied migration history of the NOVA IA project; do not apply them again to the existing database.

## Status
Interactive local demo plus a database-backed workspace when the Supabase variables are configured. External channels and AI providers remain unconnected.
