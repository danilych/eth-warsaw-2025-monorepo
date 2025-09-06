import type { Context } from 'hono';

// biome-ignore lint/complexity/noBannedTypes: <explanation>
export const authMiddleware = async (c: Context, next: Function) => {
  if (!(await c.get('civicAuth').isLoggedIn()))
    return c.text('Unauthorized', 401);
  return next();
};
