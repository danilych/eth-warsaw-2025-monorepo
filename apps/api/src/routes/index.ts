import { OpenAPIHono } from '@hono/zod-openapi';
import { testRouter } from './test/test.routes';
import { authRouter } from './auth/auth';

export const router = new OpenAPIHono();
router.route('/test', testRouter);
router.route('/auth', authRouter);
