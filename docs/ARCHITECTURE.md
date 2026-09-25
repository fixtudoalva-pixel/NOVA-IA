# Architecture v0

## Core flow
Goal -> Context -> Plan -> Decision -> Approval policy -> Action -> Outcome -> Attribution -> Ledger

## Core domains
- Organizations and memberships
- Knowledge and policies
- Contacts and leads
- Conversations and messages
- Goals
- Agents and agent runs
- Tasks
- Decisions
- Approval requests
- Actions
- Outcomes
- Attribution
- Usage/cost ledger

## Autonomy levels
0. Observe only
1. Recommend
2. Execute after approval
3. Execute inside explicit limits
4. Higher autonomy for explicitly permitted action classes

Autonomy is scoped per action class. A business can allow scheduling while still requiring approval for discounts, refunds, contractual commitments, or payments.

## Safety invariants
- No cross-tenant data access.
- No external side effect without an auditable action record.
- High-impact actions require policy evaluation before execution.
- Agent outputs are untrusted until validated against schemas and policies.
- Secrets never enter source control or model-visible business content.
- Every external action supports idempotency where possible.
- Monetary attribution distinguishes assisted revenue from causally proven revenue.

## Initial technical direction
Web application with a relational PostgreSQL data model. Authentication, row-level tenant isolation and storage can be provided by Supabase. AI providers sit behind an internal adapter so models can be changed by task/cost/quality. External channels and CRMs use connector adapters.

The MVP should work with a simulated channel before any paid messaging integration.
