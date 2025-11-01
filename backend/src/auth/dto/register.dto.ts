import { z } from 'zod';

export const registerSchema = z.object({
  orgId: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(1),
  position: z.string().min(1),
});

export type RegisterDto = z.infer<typeof registerSchema>;
