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

## Migration history note
The live database migration history is append-only and includes short-lived security experiments followed by explicit rollback migrations. The repository documents the effective final state; historical migration records should not be deleted merely to simplify names.

## Authentication redirects
- Production must set NEXT_PUBLIC_SITE_URL to the stable canonical HTTPS origin.
- Request Host and Vercel host are fallbacks, not the preferred production authority.
- Post-confirmation redirects accept only bounded relative paths.

## MVP Operator approval enforcement
The database now derives the MVP Operator approval requirement itself: every proposed external Operator action is persisted as awaiting approval, regardless of any client-supplied requiresApproval field. Critical actions remain rejected. This removes the previous trust in the browser/server-action payload for approval state.

## Database validation added in this hardening pass
- Operator approval requirements are enforced by the RPC.
- MVP onboarding rejects a second organization membership and unsupported locale/currency values.
- Simulated inbound length/name validation is mirrored in the RPC.
- Core tables now constrain action risk, non-negative AI/token costs, approval decisions, non-negative revenue and Knowledge kinds.

## Conversation lifecycle
Closed conversations are rejected by both the server action and the database Operator RPC. The UI disables the Operator trigger for closed conversations; the database remains the authoritative enforcement layer.
