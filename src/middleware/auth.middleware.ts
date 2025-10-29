// src/middleware/auth.middleware.ts
import { Context } from 'elysia';
import { UserRole } from '@prisma/client'; // ✅ Use Prisma's enum directly

// Define the shape of our JWT payload
export interface JwtPayload {
  id: string;
  role: UserRole; // ✅ Matches Prisma enum at runtime
  iat: number;
  exp: number;
}

interface AuthContext extends Context {
  jwt: {
    verify: (token: string) => Promise<JwtPayload | false>;
  };
  store: {
    user?: JwtPayload;
  };
}

export const isAuthenticated = async ({ jwt, headers, set, store }: AuthContext) => {
  const authHeader = headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    set.status = 401;
    return { error: 'Authorization header missing or invalid.' };
  }

  const token = authHeader.split(' ')[1];
  const user = await jwt.verify(token);

  if (!user) {
    set.status = 401;
    return { error: 'Invalid or expired token.' };
  }

  store.user = user;
};

export const hasRole = (requiredRole: UserRole) => {
  return ({ store, set }: AuthContext) => {
    const user = store.user;

    if (!user) {
      set.status = 401;
      return { error: 'Not authenticated.' };
    }

    // Admins can access everything
    if (user.role !== requiredRole && user.role !== UserRole.ADMIN) {
      set.status = 403;
      return { error: `Access denied. Requires ${requiredRole} role.` };
    }
  };
};

export const isAdmin = hasRole(UserRole.ADMIN);
export const isOrganizer = hasRole(UserRole.ORGANIZER);