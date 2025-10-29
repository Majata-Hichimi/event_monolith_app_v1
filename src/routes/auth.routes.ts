import Elysia from 'elysia';
import { loginHandler, signupHandler } from '../controllers/auth.controller.ts';

// This function creates a 'plugin' that can be registered in index.ts
// This follows the Single Responsibility Principle for routing.
export const authRoutes = (app: Elysia) =>
  app.group('/auth', (app) =>
    app
      .post('/signup', signupHandler, {
        detail: {
          summary: 'User Signup',
          tags: ['Auth'],
        },
      })
      .post('/login', loginHandler, {
        detail: {
          summary: 'User Login',
          tags: ['Auth'],
        },
      })
  );