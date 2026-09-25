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

## Status
Foundation phase. Architecture and domain model are being established before external integrations.


## Local quality checks
Run `npm run quality` before proposing a merge. CI additionally audits both production and development dependencies at high severity. The current branch intentionally uses `npm install` until a reviewed lockfile is committed.

## Current MVP safety boundary
Operator side effects are approval-gated in the database. Assisted revenue is recorded only from human-confirmed sale outcomes. This is still a development MVP: authenticated direct table-write grants remain a known hardening item before production clients.
