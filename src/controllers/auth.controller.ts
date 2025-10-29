import { PrismaClient, UserRole } from '@prisma/client';
import { Context } from 'elysia';
import bcrypt from 'bcrypt';
import { sendVerificationEmail } from '../services/email.service.ts';

// We assume 'db' and 'jwt' are decorated on the context (see index.ts)
interface AuthContext extends Context {
  db: PrismaClient;
  jwt: {
    sign: (payload: { id: string; role: UserRole }) => Promise<string>;
  };
}

/**
 * Handles user registration.
 * Hashes password, creates user, and sends mock welcome email.
 */
export const signupHandler = async ({ db, body, set }: AuthContext) => {
  const { email, password, role } = body as Record<string, any>;

  if (!email || !password) {
    set.status = 400; // Bad Request
    return { error: 'Email and password are required.' };
  }

  try {
    // Check if user already exists
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      set.status = 409; // Conflict
      return { error: 'User with this email already exists.' };
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        // Only allow specific roles to be set, default to ATTENDEE
        role: role && Object.values(UserRole).includes(role) ? role : UserRole.ATTENDEE,
      },
    });

    // Send mock verification email (don't block response for this)
    sendVerificationEmail(user.email);

    set.status = 201; // Created
    return { message: 'User created successfully. Check your (mock) email!' };
  } catch (error) {
    console.error(error);
    set.status = 500;
    return { error: 'An error occurred during registration.' };
  }
};

/**
 * Handles user login.
 * Verifies credentials and returns a JWT.
 */
export const loginHandler = async ({ db, jwt, body, set }: AuthContext) => {
  const { email, password } = body as Record<string, any>;

  if (!email || !password) {
    set.status = 400; // Bad Request
    return { error: 'Email and password are required.' };
  }

  try {
    // Find the user
    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      set.status = 401; // Unauthorized
      return { error: 'Invalid credentials.' };
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      set.status = 401; // Unauthorized
      return { error: 'Invalid credentials.' };
    }

    // Generate JWT
    const token = await jwt.sign({
      id: user.id,
      role: user.role,
    });

    return { 
      message: 'Login successful!',
      token: token 
    };
  } catch (error) {
    console.error(error);
    set.status = 500;
    return { error: 'An error occurred during login.' };
  }
};