import { OpenAPIHono } from '@hono/zod-openapi';
import { testRouter } from './test/test.routes';
import { questRouter } from './quest/quest.routes';

export const router = new OpenAPIHono();
router.route('/test', testRouter);
router.route('/quests', questRouter);
