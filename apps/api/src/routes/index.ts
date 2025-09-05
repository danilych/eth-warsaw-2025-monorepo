import { OpenAPIHono } from '@hono/zod-openapi';
import { testRouter } from './test/test.routes';

export const router = new OpenAPIHono();
router.route('/test', testRouter);
