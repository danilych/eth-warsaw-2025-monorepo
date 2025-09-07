import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { openapiSuccessResponse, withSerializer } from 'lib/utils/openapi';
import { z } from 'zod';
import type { Env } from '../../env';
import { NotFoundException } from 'lib/exceptions/http';
import { db } from '../../databases/main-postgres';
import { users } from '../../databases/main-postgres/schema';

const openApiTags = ['Auth'];
export const authRouter = new OpenAPIHono<Env>();

authRouter.openapi(
  withSerializer(
    createRoute({
      method: 'post',
      path: '/auth/user',
      tags: openApiTags,
      security: [{ tmaJwtAuth: [], tmaSessionId: [], tmaUserTelegramId: [] }],
      request: {
        query: z.object({
          id: z.string(),
          walletAddress: z.string(),
        }),
      },
      responses: {
        200: openapiSuccessResponse({
          schema: z.string(),
        }),
      },
    })
  ),
  async (c) => {
    try {
      const { id, walletAddress } = c.req.valid('query');
      const user = c.get('user');

      if (!user || user.sub !== id) {
        throw new NotFoundException('User not found');
      }

      await db.insert(users).values({ walletAddress, civicId: id });

      return c.json({
        success: true,
        data: user,
      });
    } catch (err) {
      console.error('Auth user error:', err);
      return c.json({ success: false, message: 'Failed to get user' }, 400);
    }
  }
);
