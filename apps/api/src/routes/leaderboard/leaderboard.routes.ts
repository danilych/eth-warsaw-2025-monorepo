import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { openapiSuccessResponse, withSerializer } from 'lib/utils/openapi';
import { z } from 'zod';
import type { Env } from '../../env';
import { LeaderboardService } from '../../services/leaderboard.service';
import {
  LeaderboardDataSchema,
  LeaderboardQuerySchema,
  UserPositionSchema,
  LeaderboardStatsSchema,
} from './schema/leaderboard.schema';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { db } from '../../databases/main-postgres';
import { users } from '../../databases/main-postgres/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { NotFoundException } from 'lib/exceptions/http';

const openApiTags = ['Leaderboard'];
export const leaderboardRouter = new OpenAPIHono<Env>();

// GET /leaderboard - Get leaderboard with optional filters
leaderboardRouter.openapi(
  withSerializer(
    createRoute({
      method: 'get',
      path: '/',
      tags: openApiTags,
      summary: 'Get leaderboard',
      description:
        'Retrieve leaderboard data with optional type filtering and caching',
      request: {
        query: LeaderboardQuerySchema,
      },
      responses: {
        200: openapiSuccessResponse({
          schema: LeaderboardDataSchema,
          description: 'Leaderboard data successfully retrieved',
        }),
        500: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean(),
                message: z.string(),
              }),
            },
          },
        },
      },
    })
  ),
  async (c) => {
    try {
      const { forceRefresh } = c.req.valid('query');

      const leaderboardData = await LeaderboardService.getLeaderboard(
        // biome-ignore lint/complexity/noUselessTernary: <explanation>
        forceRefresh === 'true' ? true : false
      );

      return c.json({
        success: true,
        data: leaderboardData,
      });
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return c.json(
        { success: false, message: 'Failed to fetch leaderboard' },
        500
      );
    }
  }
);

// GET /leaderboard/stats - Get leaderboard statistics
leaderboardRouter.openapi(
  withSerializer(
    createRoute({
      method: 'get',
      path: '/stats',
      tags: openApiTags,
      summary: 'Get leaderboard statistics',
      description: 'Retrieve overall leaderboard statistics',
      responses: {
        200: openapiSuccessResponse({
          schema: LeaderboardStatsSchema,
          description: 'Leaderboard statistics successfully retrieved',
        }),
        500: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean(),
                message: z.string(),
              }),
            },
          },
        },
      },
    })
  ),
  async (c) => {
    try {
      const stats = await LeaderboardService.getLeaderboardStats();

      return c.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error fetching leaderboard stats:', error);
      return c.json(
        { success: false, message: 'Failed to fetch leaderboard statistics' },
        500
      );
    }
  }
);

// GET /leaderboard/user/{userId} - Get user's position in leaderboard
leaderboardRouter.openapi(
  withSerializer(
    createRoute({
      method: 'get',
      path: '/user/{userId}',
      tags: openApiTags,
      summary: 'Get user position in leaderboard',
      description:
        "Retrieve a specific user's rank and score in the leaderboard",
      request: {
        params: z.object({
          userId: z.string().uuid('Invalid user ID format'),
        }),
      },
      responses: {
        200: openapiSuccessResponse({
          schema: UserPositionSchema,
          description: 'User position successfully retrieved',
        }),
        404: {
          description: 'User not found in leaderboard',
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean(),
                message: z.string(),
              }),
            },
          },
        },
        500: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean(),
                message: z.string(),
              }),
            },
          },
        },
      },
    })
  ),
  async (c) => {
    try {
      const { userId } = c.req.valid('param');

      // Verify user exists
      const [user] = await db
        .select()
        .from(users)
        .where(and(eq(users.id, userId), isNull(users.deletedAt)))
        .limit(1);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const position = await LeaderboardService.getUserPosition(userId);

      if (!position) {
        return c.json(
          { success: false, message: 'User not found in leaderboard' },
          404
        );
      }

      return c.json({
        success: true,
        data: position,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        return c.json({ success: false, message: error.message }, 404);
      }

      console.error('Error fetching user position:', error);
      return c.json(
        { success: false, message: 'Failed to fetch user position' },
        500
      );
    }
  }
);

// GET /leaderboard/me - Get current user's position (requires auth)
leaderboardRouter.use('/me', authMiddleware());
leaderboardRouter.openapi(
  withSerializer(
    createRoute({
      method: 'get',
      path: '/me',
      tags: openApiTags,
      summary: 'Get current user position in leaderboard',
      description:
        "Retrieve the authenticated user's rank and score in the leaderboard",
      responses: {
        200: openapiSuccessResponse({
          schema: UserPositionSchema,
          description: 'User position successfully retrieved',
        }),
        401: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean(),
                message: z.string(),
              }),
            },
          },
        },
        404: {
          description: 'User not found in leaderboard',
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean(),
                message: z.string(),
              }),
            },
          },
        },
        500: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean(),
                message: z.string(),
              }),
            },
          },
        },
      },
    })
  ),
  async (c) => {
    try {
      const baseUser = await c.get('civicAuth').getUser();
      if (!baseUser?.id) {
        return c.json({ success: false, message: 'User not found' }, 401);
      }

      const [user] = await db
        .select()
        .from(users)
        .where(and(eq(users.civicId, baseUser.id), isNull(users.deletedAt)))
        .limit(1);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const position = await LeaderboardService.getUserPosition(user.id);

      if (!position) {
        return c.json(
          { success: false, message: 'User not found in leaderboard' },
          404
        );
      }

      return c.json({
        success: true,
        data: position,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        return c.json({ success: false, message: error.message }, 404);
      }

      console.error('Error fetching current user position:', error);
      return c.json(
        { success: false, message: 'Failed to fetch user position' },
        500
      );
    }
  }
);

// POST /leaderboard/refresh - Force refresh leaderboard (admin endpoint)
leaderboardRouter.openapi(
  withSerializer(
    createRoute({
      method: 'post',
      path: '/refresh',
      tags: openApiTags,
      summary: 'Force refresh leaderboard',
      description:
        'Force recalculation and storage of leaderboard data in GolemDB',
      responses: {
        200: openapiSuccessResponse({
          schema: z.object({
            message: z.string(),
            entityKey: z.string(),
            entriesCount: z.number(),
            validUntilBlock: z.number(),
          }),
          description: 'Leaderboard successfully refreshed',
        }),
        500: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean(),
                message: z.string(),
              }),
            },
          },
        },
      },
    })
  ),
  async (c) => {
    try {
      const { entityKey, data } =
        await LeaderboardService.generateAndStoreLeaderboard();

      return c.json({
        success: true,
        data: {
          message: 'Top 25 leaderboard refreshed successfully (1-hour cache)',
          entityKey,
          entriesCount: data.entries.length,
          validUntilBlock: data.validUntilBlock,
        },
      });
    } catch (error) {
      console.error('Error refreshing leaderboard:', error);
      return c.json(
        { success: false, message: 'Failed to refresh leaderboard' },
        500
      );
    }
  }
);

// POST /leaderboard/cleanup - Clean up expired leaderboards (admin endpoint)
leaderboardRouter.openapi(
  withSerializer(
    createRoute({
      method: 'post',
      path: '/cleanup',
      tags: openApiTags,
      summary: 'Clean up expired leaderboards',
      description: 'Remove expired leaderboard entries from GolemDB',
      responses: {
        200: openapiSuccessResponse({
          schema: z.object({
            message: z.string(),
          }),
          description: 'Cleanup completed successfully',
        }),
        500: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean(),
                message: z.string(),
              }),
            },
          },
        },
      },
    })
  ),
  async (c) => {
    try {
      await LeaderboardService.cleanupExpiredLeaderboards();

      return c.json({
        success: true,
        data: {
          message: 'Expired leaderboards cleaned up successfully',
        },
      });
    } catch (error) {
      console.error('Error cleaning up leaderboards:', error);
      return c.json(
        { success: false, message: 'Failed to clean up leaderboards' },
        500
      );
    }
  }
);
