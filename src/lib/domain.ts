export type AutonomyLevel = 0 | 1 | 2 | 3 | 4;

export type ActionRisk = "low" | "medium" | "high" | "critical";

export interface PolicyDecision {
  allowed: boolean;
  requiresApproval: boolean;
  reason: string;
}

const validRisks = new Set<ActionRisk>(["low", "medium", "high", "critical"]);

export function evaluateActionPolicy(input: {
  autonomy: AutonomyLevel;
  risk: ActionRisk;
  hasExternalSideEffect: boolean;
}): PolicyDecision {
  if (!validRisks.has(input.risk)) {
    return { allowed: false, requiresApproval: true, reason: "Invalid action risk." };
  }
  if (input.risk === "critical") {
    return { allowed: false, requiresApproval: true, reason: "Critical actions are blocked in MVP." };
  }
  if (!input.hasExternalSideEffect) {
    return { allowed: true, requiresApproval: false, reason: "Read-only/internal action." };
  }
  if (!Number.isInteger(input.autonomy) || input.autonomy < 0 || input.autonomy > 4) {
    return { allowed: false, requiresApproval: true, reason: "Invalid autonomy level." };
  }
  if (input.autonomy < 2) {
    return { allowed: true, requiresApproval: true, reason: "Current autonomy requires human approval." };
  }
  if (input.risk === "high") {
    return { allowed: true, requiresApproval: true, reason: "High-risk actions always require approval." };
  }
  return {
    allowed: true,
    requiresApproval: input.autonomy < 3,
    reason: input.autonomy >= 3 ? "Within bounded autonomy." : "Approval required at current autonomy."
  };
}
