import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { openapiSuccessResponse, withSerializer } from 'lib/utils/openapi';
import { z } from 'zod';

const openApiTags = ['Test'];
export const testRouter = new OpenAPIHono();

testRouter.openapi(
  withSerializer(
    createRoute({
      method: 'post',
      path: '/hello-world',
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
    return c.json({
      success: true,
      data: 'Hello world',
    });
  }
);
