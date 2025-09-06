import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { openapiSuccessResponse, withSerializer } from 'lib/utils/openapi';
import { z } from 'zod';
import { eq, isNull, and } from 'drizzle-orm';
import { db } from '../../databases/main-postgres';
import {
  quests,
  questTypes,
  userQuests,
  questStatuses,
} from '../../databases/main-postgres/schema';

const openApiTags = ['Quest'];
export const questRouter = new OpenAPIHono();

const QuestTypeSchema = z.enum(questTypes as [string, ...string[]]);
const QuestStatusSchema = z.enum(questStatuses as [string, ...string[]]);

const QuestSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  imageUrl: z.string().nullable(),
  questType: QuestTypeSchema,
  target: z.string(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
  deletedAt: z.string().nullable(),
});

const UserQuestSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  questId: z.string().uuid(),
  status: QuestStatusSchema,
  progress: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

const UserQuestWithQuestSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  questId: z.string().uuid(),
  status: QuestStatusSchema,
  progress: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
  quest: QuestSchema,
});

const CreateQuestSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  description: z.string()
    .min(1, 'Description is required')
    .max(1000, 'Description must be less than 1000 characters')
    .trim(),
  imageUrl: z.string()
    .url('Must be a valid URL')
    .max(500, 'Image URL must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  questType: QuestTypeSchema,
  target: z.string()
    .min(1, 'Target is required')
    .max(200, 'Target must be less than 200 characters')
    .trim(),
});

const UpdateQuestSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim()
    .optional(),
  description: z.string()
    .min(1, 'Description is required')
    .max(1000, 'Description must be less than 1000 characters')
    .trim()
    .optional(),
  imageUrl: z.string()
    .url('Must be a valid URL')
    .max(500, 'Image URL must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  questType: QuestTypeSchema.optional(),
  target: z.string()
    .min(1, 'Target is required')
    .max(200, 'Target must be less than 200 characters')
    .trim()
    .optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  {
    message: 'At least one field must be provided for update',
  }
);

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

    const quest = await db
      .select()
      .from(quests)
      .where(and(eq(quests.id, id), isNull(quests.deletedAt)))
      .limit(1);

    if (quest.length === 0) {
      return c.json({ success: false, message: 'Quest not found' }, 404);
    }

    return c.json({
      success: true,
      data: quest[0],
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
      const newQuest = await db
        .insert(quests)
        .values({
          name: body.name,
          description: body.description,
          imageUrl: body.imageUrl || null,
          questType: body.questType,
          target: body.target,
        })
        .returning();

      return c.json(
        {
          success: true,
          data: newQuest[0],
        },
        201
      );
    } catch (error) {
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
      const existingQuest = await db
        .select()
        .from(quests)
        .where(and(eq(quests.id, id), isNull(quests.deletedAt)))
        .limit(1);

      if (existingQuest.length === 0) {
        return c.json({ success: false, message: 'Quest not found' }, 404);
      }

      const updatedQuest = await db
        .update(quests)
        .set({
          ...body,
          updatedAt: new Date(),
        })
        .where(eq(quests.id, id))
        .returning();

      return c.json({
        success: true,
        data: updatedQuest[0],
      });
    } catch (error) {
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
      const existingQuest = await db
        .select()
        .from(quests)
        .where(and(eq(quests.id, id), isNull(quests.deletedAt)))
        .limit(1);

      if (existingQuest.length === 0) {
        return c.json({ success: false, message: 'Quest not found' }, 404);
      }

      await db
        .update(quests)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(quests.id, id));

      return c.json({
        success: true,
        data: { message: 'Quest deleted successfully' },
      });
    } catch (error) {
      return c.json({ success: false, message: 'Failed to delete quest' }, 400);
    }
  }
);

questRouter.openapi(
  withSerializer(
    createRoute({
      method: 'get',
      path: '/user/{userId}/quest/{questId}',
      tags: openApiTags,
      request: {
        params: z.object({
          userId: z.string().uuid('Invalid user ID format'),
          questId: z.string().uuid('Invalid quest ID format'),
        }),
      },
      responses: {
        200: openapiSuccessResponse({
          schema: UserQuestSchema,
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

    const userQuest = await db
      .select()
      .from(userQuests)
      .where(
        and(
          eq(userQuests.userId, userId),
          eq(userQuests.questId, questId),
          isNull(userQuests.deletedAt)
        )
      )
      .limit(1);

    if (userQuest.length === 0) {
      return c.json({ success: false, message: 'User quest not found' }, 404);
    }

    return c.json({
      success: true,
      data: userQuest[0],
    });
  }
);

questRouter.openapi(
  withSerializer(
    createRoute({
      method: 'get',
      path: '/user/{userId}/quests',
      tags: openApiTags,
      request: {
        params: z.object({
          userId: z.string().uuid('Invalid user ID format'),
        }),
      },
      responses: {
        200: openapiSuccessResponse({
          schema: z.array(UserQuestWithQuestSchema),
        }),
      },
    })
  ),
  async (c) => {
    const { userId } = c.req.valid('param');

    const userQuestsWithQuests = await db
      .select({
        id: userQuests.id,
        userId: userQuests.userId,
        questId: userQuests.questId,
        status: userQuests.status,
        createdAt: userQuests.createdAt,
        updatedAt: userQuests.updatedAt,
        quest: {
          id: quests.id,
          name: quests.name,
          description: quests.description,
          imageUrl: quests.imageUrl,
          questType: quests.questType,
          target: quests.target,
          createdAt: quests.createdAt,
          updatedAt: quests.updatedAt,
          deletedAt: quests.deletedAt,
        },
      })
      .from(userQuests)
      .innerJoin(quests, eq(userQuests.questId, quests.id))
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
