import { AssignmentStatus } from '@prisma/client';
import { z } from 'zod';

export const createAssignmentSchema = z
  .object({
    orgId: z.string().min(1),
    userId: z.string().min(1),
    workplaceId: z.string().min(1),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    status: z.nativeEnum(AssignmentStatus).default(AssignmentStatus.PLANNED),
  })
  .refine((data) => data.endsAt > data.startsAt, {
    message: 'endsAt must be after startsAt',
    path: ['endsAt'],
  });

export type CreateAssignmentDto = z.infer<typeof createAssignmentSchema>;
