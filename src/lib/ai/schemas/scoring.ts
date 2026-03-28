import { z } from 'zod';

export const signalResultSchema = z.object({
  id: z.number(),
  score: z.number().min(1).max(10),
  status: z.enum(['pass', 'flag', 'fail']),
  evidence: z.string(),
  finding: z.string(),
});

export const categoryResponseSchema = z.object({
  signals: z.array(signalResultSchema),
  category_summary: z.string(),
});

export type CategoryAIResponse = z.infer<typeof categoryResponseSchema>;
