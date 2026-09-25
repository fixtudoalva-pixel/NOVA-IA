# Security posture

## Trust boundaries
- Browser input is untrusted.
- Tenant identity comes from authenticated membership, never from form fields.
- RLS is required on tenant-owned tables.
- High-risk Operator actions require human approval.
- Critical Operator actions are blocked in the MVP.
- Operator commits are idempotent by inbound source message.
- Sale revenue is human-confirmed assisted attribution, not causal proof.

## Current limitations
- Some authenticated table write grants remain necessary because public RPCs are SECURITY INVOKER. RLS still scopes them to tenant membership, but callers can potentially bypass intended workflow transitions inside their own tenant. Do not describe the operational write boundary as production-hardened yet.
- Moving sensitive writes behind a backend-only executor/private boundary is required before real customer deployment.
- Supabase leaked-password protection is currently reported disabled by Security Advisor.
- Multi-organization selection is not implemented; current UI uses the first membership.

## Operational rules
- Never expose the Supabase service-role key to browser code.
- Never commit production secrets.
- Do not use SECURITY DEFINER in the exposed public API schema merely to bypass table grants.
- Re-run Security Advisor after database privilege or RPC changes.
- Verify RLS with two authenticated tenants before production.
