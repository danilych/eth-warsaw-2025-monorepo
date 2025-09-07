import { createMiddleware } from 'hono/factory';
import { verify } from '@civic/auth-verify';
export const authMiddleware = () => {
  return createMiddleware(async (c, next) => {
    const token = c.req.header('Authorization')?.split(' ')?.[1];
    if (!token) return c.json({ success: false, message: 'Unauthorized' }, 401);

    try {
      const payload = await verify(token);
      console.log('payload', payload);
      c.set('user', payload);
    } catch (error) {
      console.error('Error verifying token:', error);
      return c.json({ success: false, message: 'Unauthorized' }, 401);
    }

    return next();
  });
};
