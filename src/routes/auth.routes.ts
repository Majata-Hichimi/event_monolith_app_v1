import { Elysia, t } from "elysia";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

export const authRoutes = new Elysia({ prefix: "" })
  // Signup
  .post(
    "/signup",
    async ({ body, set }) => {
      try {
        const { email, password, role } = body;

        // Check if user exists
        const existingUser = await db.user.findUnique({ where: { email } });
        if (existingUser) {
          set.status = 400;
          return { error: "Email already registered" };
        }

        // Hash password
        const hashedPassword = await Bun.password.hash(password);

        // Create user
        const user = await db.user.create({
          data: {
            email,
            password: hashedPassword,
            role: role || "ATTENDEE",
          },
        });

        return {
          message: "Account created successfully",
          userId: user.id,
        };
      } catch (error: any) {
        set.status = 500;
        return { error: error.message || "Signup failed" };
      }
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 6 }),
        role: t.Optional(t.String()),
      }),
    }
  )
  // Login
  .post(
    "/login",
    async ({ body, jwt, set }) => {
      try {
        const { email, password } = body;

        // Find user
        const user = await db.user.findUnique({ where: { email } });
        if (!user) {
          set.status = 401;
          return { error: "Invalid credentials" };
        }

        // Verify password
        const valid = await Bun.password.verify(password, user.password);
        if (!valid) {
          set.status = 401;
          return { error: "Invalid credentials" };
        }

        // Create JWT token
        const token = await jwt.sign({
          id: user.id,
          email: user.email,
          role: user.role,
        });

        return {
          token,
          role: user.role,
          email: user.email,
        };
      } catch (error: any) {
        set.status = 500;
        return { error: error.message || "Login failed" };
      }
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
    }
  );
