import { createMiddleware } from 'hono/factory';

export const authMiddleware = () => {
  return createMiddleware(async (c, next) => {
    if (!(await c.get('civicAuth').isLoggedIn()))
      return c.text('Unauthorized', 401);
    return next();
  });
};
