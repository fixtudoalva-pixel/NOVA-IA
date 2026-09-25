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

The simulator uses deterministic rules, not a connected AI model. Its replies are never sent to a customer. No account, database or external channel is connected yet.

## Status
Interactive demo of the inbox and approval policy. The SQL schema and operator contract are foundations for later integration, not active persistence.
