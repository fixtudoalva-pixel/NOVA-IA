-- Remove the legacy timestamp-based overload after source-message idempotency became canonical.
drop function if exists public.commit_operator_decision(uuid,timestamptz,jsonb,jsonb);
