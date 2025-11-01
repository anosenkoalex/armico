import { UserRole } from '@prisma/client';
import { z } from 'zod';

export const createUserSchema = z.object({
  orgId: z.string().min(1).optional(),
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(1).optional(),
  position: z.string().min(1).optional(),
  role: z.nativeEnum(UserRole).default(UserRole.USER),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
