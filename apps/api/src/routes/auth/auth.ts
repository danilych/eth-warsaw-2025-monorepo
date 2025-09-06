import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { openapiSuccessResponse, withSerializer } from 'lib/utils/openapi';
import { z } from 'zod';
import type { HandleCallbackRequest } from '@civic/auth/server';
import type { Env } from '../../env';
import { NotFoundException } from 'lib/exceptions/http';
import { db } from '../../databases/main-postgres';
import { users } from '../../databases/main-postgres/schema';
import { eq } from 'drizzle-orm';

const openApiTags = ['Auth'];
export const authRouter = new OpenAPIHono<Env>();

authRouter.openapi(
  withSerializer(
    createRoute({
      method: 'get',
      path: '/auth',
      tags: openApiTags,
      security: [{ tmaJwtAuth: [], tmaSessionId: [], tmaUserTelegramId: [] }],
      responses: {
        200: openapiSuccessResponse({
          schema: z.string(),
        }),
      },
    })
  ),
  async (c) => {
    const url = await c.get('civicAuth').buildLoginUrl();

    return c.redirect(url.toString());
  }
);

authRouter.openapi(
  withSerializer(
    createRoute({
      method: 'get',
      path: '/auth/callback',
      tags: openApiTags,
      security: [{ tmaJwtAuth: [], tmaSessionId: [], tmaUserTelegramId: [] }],
      request: {
        query: z.object({
          code: z.string(),
          state: z.string(),
        }),
      },
      responses: {
        200: openapiSuccessResponse({
          schema: z.union([
            z.string(),
            z.object({
              success: z.boolean(),
              user: z.any().nullable().optional(),
            }),
          ]),
        }),
      },
    })
  ),
  async (c) => {
    try {
      const code = c.req.query('code') as string;
      const state = c.req.query('state') as string;
      c.req.valid('query');

      const result = await c.get('civicAuth').handleCallback({
        code,
        state,
        req: c.req as unknown as HandleCallbackRequest,
      });

      if (result.redirectTo) {
        return c.redirect(result.redirectTo);
      }

      if (result.content) {
        if (typeof result.content === 'string') {
          return c.html(result.content);
        }

        return c.json(result.content);
      }

      return c.json({ error: 'Internal server error' }, 500);
    } catch {
      return c.redirect('/?error=auth_failed');
    }
  }
);

authRouter.openapi(
  withSerializer(
    createRoute({
      method: 'get',
      path: '/auth/logout',
      tags: openApiTags,
      security: [{ tmaJwtAuth: [], tmaSessionId: [], tmaUserTelegramId: [] }],
      responses: {
        200: openapiSuccessResponse({
          schema: z.string(),
        }),
      },
    })
  ),
  async (c) => {
    try {
      const urlString = await c.get('civicAuth').buildLogoutRedirectUrl();
      await c.get('civicAuth').clearTokens();

      const url = new URL(urlString);
      url.searchParams.delete('state');

      return c.redirect(url.toString());
    } catch (error) {
      console.error('Logout error:', error);
      await c.get('civicAuth').clearTokens();
      return c.redirect('/');
    }
  }
);

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
      const user = await c.get('civicAuth').getUser();

      if (!user || user.id !== id) {
        throw NotFoundException;
      }

      await db
        .update(users)
        .set({ walletAddress, civicId: id })
        .where(eq(users.id, id));

      return c.json({
        success: true,
        data: user,
      });
    } catch {
      return c.json({ success: false, message: 'Failed to get user' }, 400);
    }
  }
);
