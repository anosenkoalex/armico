import { AssignmentStatus } from '@prisma/client';
import { z } from 'zod';

export const listAssignmentsSchema = z
  .object({
    userId: z.string().min(1).optional(),
    workplaceId: z.string().min(1).optional(),
    status: z.nativeEnum(AssignmentStatus).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .superRefine((data, ctx) => {
    if (data.from && data.to && data.to < data.from) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['to'],
        message: 'to must be after from',
      });
    }
  });

export type ListAssignmentsDto = z.infer<typeof listAssignmentsSchema>;
