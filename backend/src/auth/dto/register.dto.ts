import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(1).optional(),
  position: z.string().min(1).optional(),
  orgId: z.string().min(1).optional(),
});

export type RegisterDto = z.infer<typeof registerSchema>;
