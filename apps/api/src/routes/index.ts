import { OpenAPIHono } from '@hono/zod-openapi';
import { testRouter } from './test/test.routes';
import { questRouter } from './quest/quest.routes';
import { authRouter } from './auth/auth';
import { leaderboardRouter } from './leaderboard/leaderboard.routes';

export const router = new OpenAPIHono();
router.route('/test', testRouter);
router.route('/quests', questRouter);
router.route('/auth', authRouter);
router.route('/leaderboard', leaderboardRouter);
