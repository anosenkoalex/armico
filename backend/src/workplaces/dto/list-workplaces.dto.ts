import { z } from 'zod';

export const listWorkplacesSchema = z.object({
  search: z.string().trim().optional(),
  isActive: z
    .string()
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListWorkplacesDto = z.infer<typeof listWorkplacesSchema>;
