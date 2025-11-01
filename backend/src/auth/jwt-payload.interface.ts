import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  orgId: string | null;
  role: UserRole;
  iat?: number;
  exp?: number;
}
