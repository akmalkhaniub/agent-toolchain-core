import { z } from 'zod';

export const AgentRulesSchema = z.object({
  title: z.string().min(1, 'Rules document must have a title'),
  architecturePhilosophy: z.array(z.string()).min(1, 'At least one architecture philosophy point is required'),
  allowedActions: z.array(z.string()).default([]),
  forbiddenPatterns: z.array(z.string()).min(1, 'Must specify forbidden anti-patterns'),
  verificationCommands: z.array(z.string()).min(1, 'Must declare at least one verification/test command'),
  testingStandards: z.array(z.string()).default([]),
  rawSections: z.record(z.string()).optional()
});

export type AgentRulesSpec = z.infer<typeof AgentRulesSchema>;
