import { z } from "zod";

export const OperatorDecisionSchema = z.object({
  intent: z.string().min(1),
  summary: z.string().min(1),
  confidence: z.number().min(0).max(1),
  reply: z.string().min(1),
  proposedActions: z.array(z.object({
    type: z.string().min(1),
    risk: z.enum(["low", "medium", "high", "critical"]),
    rationale: z.string().min(1),
    payload: z.record(z.string(), z.unknown()).default({})
  })).default([]),
  needsHuman: z.boolean().default(false),
  humanReason: z.string().nullable().default(null)
});

export type OperatorDecision = z.infer<typeof OperatorDecisionSchema>;
