import { AssignmentStatus } from '@prisma/client';
import { z } from 'zod';

export const createAssignmentSchema = z
  .object({
    userId: z.string().min(1),
    workplaceId: z.string().min(1),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date().optional().nullable(),
    status: z.nativeEnum(AssignmentStatus).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.endsAt && data.endsAt <= data.startsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endsAt'],
        message: 'endsAt must be after startsAt',
      });
    }
  });

export type CreateAssignmentDto = z.infer<typeof createAssignmentSchema>;
