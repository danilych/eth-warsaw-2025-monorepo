import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { openapiSuccessResponse, withSerializer } from 'lib/utils/openapi';
import { z } from 'zod';
import { eq, isNull, and } from 'drizzle-orm';
import { db } from '../../databases/main-postgres';
import { quests, userQuests } from '../../databases/main-postgres/schema';
import {
  CreateQuestSchema,
  QuestSchema,
  UpdateQuestSchema,
  QuestWithUserStatusSchema,
} from './schema/quest.schema';
import { NotFoundException } from 'lib/exceptions/http';
import { QuestService } from '../../services/blockchain/quest.service';
import { SignatureService } from '../../services/blockchain/signature.service';
import { authMiddleware } from '../../middlewares/auth.middleware';
import type { Env } from '../../env';

const openApiTags = ['Quest'];
export const questRouter = new OpenAPIHono<Env>();
questRouter.use('/{questId}/claim', authMiddleware());
questRouter.openapi(
  withSerializer(
    createRoute({
      method: 'get',
      path: '/',
      tags: openApiTags,
      responses: {
        200: openapiSuccessResponse({
          schema: z.array(QuestSchema),
        }),
      },
    })
  ),
  async (c) => {
    const allQuests = await db
      .select()
      .from(quests)
      .where(isNull(quests.deletedAt));

    return c.json({
      success: true,
      data: allQuests,
    });
  }
);

questRouter.openapi(
  withSerializer(
    createRoute({
      method: 'get',
      path: '/{id}',
      tags: openApiTags,
      request: {
        params: z.object({
          id: z.string().uuid('Invalid quest ID format'),
        }),
      },
      responses: {
        200: openapiSuccessResponse({
          schema: QuestSchema,
        }),
        404: {
          description: 'Quest not found',
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
    const { id } = c.req.valid('param');

    const [quest] = await db
      .select()
      .from(quests)
      .where(and(eq(quests.id, id), isNull(quests.deletedAt)))
      .limit(1);

    if (!quest) {
      throw NotFoundException;
    }

    return c.json({
      success: true,
      data: quest,
    });
  }
);

questRouter.openapi(
  withSerializer(
    createRoute({
      method: 'post',
      path: '/',
      tags: openApiTags,
      request: {
        body: {
          content: {
            'application/json': {
              schema: CreateQuestSchema,
            },
          },
        },
      },
      responses: {
        201: openapiSuccessResponse({
          schema: QuestSchema,
        }),
        400: {
          description: 'Bad request',
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
    const body = c.req.valid('json');

    try {
      const [newQuest] = await db
        .insert(quests)
        .values({
          name: body.name,
          description: body.description,
          imageUrl: body.imageUrl || null,
          questType: body.questType,
          rewardAmount: body.reward,
          rewardTokenAddress: body.rewardTokenAddress,
          expiry: body.expiry,
          fromAddress: body.fromAddress || null,
          toAddress: body.toAddress || null,
          amount: body.amount || null,
          tokenAddress: body.tokenAddress || null,
          nftAddress: body.nftAddress || null,
        })
        .returning();

      await QuestService.createQuest({
        id: newQuest.id,
        reward: body.reward.toString(),
        rewardToken: body.rewardTokenAddress,
        expiry: body.expiry.toString(),
        createdAt: new Date().toISOString(),
      });

      return c.json(
        {
          success: true,
          data: newQuest,
        },
        201
      );
    } catch {
      return c.json({ success: false, message: 'Failed to create quest' }, 400);
    }
  }
);

questRouter.openapi(
  withSerializer(
    createRoute({
      method: 'put',
      path: '/{id}',
      tags: openApiTags,
      request: {
        params: z.object({
          id: z.string().uuid('Invalid quest ID format'),
        }),
        body: {
          content: {
            'application/json': {
              schema: UpdateQuestSchema,
            },
          },
        },
      },
      responses: {
        200: openapiSuccessResponse({
          schema: QuestSchema,
        }),
        404: {
          description: 'Quest not found',
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean(),
                message: z.string(),
              }),
            },
          },
        },
        400: {
          description: 'Bad request',
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
    const { id } = c.req.valid('param');
    const body = c.req.valid('json');

    try {
      const [existingQuest] = await db
        .select()
        .from(quests)
        .where(and(eq(quests.id, id), isNull(quests.deletedAt)))
        .limit(1);

      if (!existingQuest) {
        throw NotFoundException;
      }

      const updateData = { ...body, updatedAt: new Date() };

      const [updatedQuest] = await db
        .update(quests)
        .set(updateData)
        .where(eq(quests.id, id))
        .returning();

      return c.json({
        success: true,
        data: updatedQuest,
      });
    } catch {
      return c.json({ success: false, message: 'Failed to update quest' }, 400);
    }
  }
);

questRouter.openapi(
  withSerializer(
    createRoute({
      method: 'delete',
      path: '/{id}',
      tags: openApiTags,
      request: {
        params: z.object({
          id: z.string().uuid('Invalid quest ID format'),
        }),
      },
      responses: {
        200: openapiSuccessResponse({
          schema: z.object({
            message: z.string(),
          }),
        }),
        404: {
          description: 'Quest not found',
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
    const { id } = c.req.valid('param');

    try {
      const [existingQuest] = await db
        .select()
        .from(quests)
        .where(and(eq(quests.id, id), isNull(quests.deletedAt)))
        .limit(1);

      if (!existingQuest) {
        throw NotFoundException;
      }

      await db
        .update(quests)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(quests.id, id));

      await QuestService.removeQuest(id);

      return c.json({
        success: true,
        data: { message: 'Quest deleted successfully' },
      });
    } catch {
      return c.json({ success: false, message: 'Failed to delete quest' }, 400);
    }
  }
);

questRouter.openapi(
  withSerializer(
    createRoute({
      method: 'get',
      path: '/{questId}/user-quests/{userId}',
      tags: openApiTags,
      request: {
        params: z.object({
          userId: z.string().uuid('Invalid user ID format'),
          questId: z.string().uuid('Invalid quest ID format'),
        }),
      },
      responses: {
        200: openapiSuccessResponse({
          schema: QuestWithUserStatusSchema,
        }),
        404: {
          description: 'User quest not found',
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
    const { userId, questId } = c.req.valid('param');

    const [result] = await db
      .select({
        id: quests.id,
        name: quests.name,
        description: quests.description,
        imageUrl: quests.imageUrl,
        questType: quests.questType,
        rewardAmount: quests.rewardAmount,
        rewardTokenAddress: quests.rewardTokenAddress,
        expiry: quests.expiry,
        createdAt: quests.createdAt,
        updatedAt: quests.updatedAt,
        deletedAt: quests.deletedAt,
        userStatus: {
          id: userQuests.id,
          userId: userQuests.userId,
          status: userQuests.status,
          createdAt: userQuests.createdAt,
          updatedAt: userQuests.updatedAt,
        },
      })
      .from(quests)
      .innerJoin(userQuests, eq(quests.id, userQuests.questId))
      .where(
        and(
          eq(userQuests.userId, userId),
          eq(userQuests.questId, questId),
          isNull(userQuests.deletedAt),
          isNull(quests.deletedAt)
        )
      )
      .limit(1);

    if (!result) {
      throw NotFoundException;
    }

    return c.json({
      success: true,
      data: result,
    });
  }
);

questRouter.openapi(
  withSerializer(
    createRoute({
      method: 'get',
      path: '/user-quests/{userId}',
      tags: openApiTags,
      request: {
        params: z.object({
          userId: z.string().uuid('Invalid user ID format'),
        }),
      },
      responses: {
        200: openapiSuccessResponse({
          schema: z.array(QuestWithUserStatusSchema),
        }),
      },
    })
  ),
  async (c) => {
    const { userId } = c.req.valid('param');

    const [userQuestsWithQuests] = await db
      .select()
      .from(quests)
      .leftJoin(userQuests, eq(quests.id, userQuests.questId))
      .where(
        and(
          eq(userQuests.userId, userId),
          isNull(userQuests.deletedAt),
          isNull(quests.deletedAt)
        )
      );

    return c.json({
      success: true,
      data: userQuestsWithQuests,
    });
  }
);

questRouter.openapi(
  withSerializer(
    createRoute({
      method: 'post',
      path: '/{questId}/claim',
      tags: openApiTags,
      request: {
        params: z.object({
          questId: z.string().uuid('Invalid quest ID format'),
          walletAddress: z.string().min(42).max(42),
        }),
      },
      responses: {
        200: openapiSuccessResponse({
          schema: z.object({
            signature: z.string(),
            questId: z.string().uuid(),
            userAddress: z.string(),
          }),
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
          description: 'Quest not found',
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
      const { questId } = c.req.valid('param');

      const baseUser = await c.get('civicAuth').getUser();

      if (!baseUser?.id) {
        return c.json({ success: false, message: 'User not found' }, 400);
      }

      const [quest] = await db
        .select()
        .from(quests)
        .where(and(eq(quests.id, questId), isNull(quests.deletedAt)))
        .limit(1);

      if (!quest) {
        throw NotFoundException;
      }

      const signature = await SignatureService.generateEIP712Signature(
        questId,
        c.req.valid('param').walletAddress
      );

      return c.json({
        success: true,
        data: {
          signature,
          questId,
          userAddress: c.req.valid('param').walletAddress,
        },
      });
    } catch (error) {
      console.error('Error claiming quest:', error);
      return c.json({ success: false, message: 'Failed to claim quest' }, 500);
    }
  }
);
