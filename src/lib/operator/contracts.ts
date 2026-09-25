import { z } from "zod";

export const OperatorDecisionSchema = z.object({
  intent: z.string().min(1).max(120),
  summary: z.string().min(1).max(2000),
  confidence: z.number().min(0).max(1),
  reply: z.string().min(1).max(10000),
  proposedActions: z.array(z.object({
    type: z.string().min(1).max(120),
    risk: z.enum(["low", "medium", "high", "critical"]),
    rationale: z.string().min(1).max(2000),
    payload: z.record(z.string(), z.unknown()).default({})
  })).max(20).default([]),
  needsHuman: z.boolean().default(false),
  humanReason: z.string().max(2000).nullable().default(null)
});

export type OperatorDecision = z.infer<typeof OperatorDecisionSchema>;
