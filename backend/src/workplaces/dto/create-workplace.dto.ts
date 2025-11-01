import { z } from 'zod';

export const createWorkplaceSchema = z.object({
  orgId: z.string().min(1),
  code: z.string().trim().min(1),
  name: z.string().min(1),
  location: z.string().min(1).optional(),
  isActive: z.boolean().default(true),
});

export type CreateWorkplaceDto = z.infer<typeof createWorkplaceSchema>;
