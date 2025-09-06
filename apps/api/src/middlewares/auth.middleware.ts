import { isLoggedIn } from '@civic/auth/server';
import type { Context } from 'hono';

const authMiddleware = async (c: Context, next: Function) => {
  if (!(await c.get('civicAuth').isLoggedIn()))
    return c.text('Unauthorized', 401);
  return next();
};

export default authMiddleware;
