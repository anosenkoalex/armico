import { z } from 'zod';

export const createOrgSchema = z.object({
  name: z.string().min(1),
  slug: z.string().trim().min(1),
});

export type CreateOrgDto = z.infer<typeof createOrgSchema>;
