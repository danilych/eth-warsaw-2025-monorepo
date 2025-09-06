import { z } from '@hono/zod-openapi';
import { EQuestStatuses, EQuestTypes } from 'lib/enums/quests';

export const QuestTypeSchema = z.nativeEnum(EQuestTypes);
export const QuestStatusSchema = z.nativeEnum(EQuestStatuses);

export const QuestSchema = z.object({
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

export const UserQuestSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  questId: z.string().uuid(),
  status: QuestStatusSchema,
  progress: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

export const QuestWithUserStatusSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  imageUrl: z.string().nullable(),
  questType: QuestTypeSchema,
  target: z.string(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
  deletedAt: z.string().nullable(),
  userStatus: z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    status: QuestStatusSchema,
    progress: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string().nullable(),
  }).nullable(),
});

export const CreateQuestSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(1000, 'Description must be less than 1000 characters')
    .trim(),
  imageUrl: z
    .string()
    .url('Must be a valid URL')
    .max(500, 'Image URL must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  questType: QuestTypeSchema,
  target: z
    .string()
    .min(1, 'Target is required')
    .max(200, 'Target must be less than 200 characters')
    .trim(),
});

export const UpdateQuestSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name must be less than 100 characters')
      .trim()
      .optional(),
    description: z
      .string()
      .min(1, 'Description is required')
      .max(1000, 'Description must be less than 1000 characters')
      .trim()
      .optional(),
    imageUrl: z
      .string()
      .url('Must be a valid URL')
      .max(500, 'Image URL must be less than 500 characters')
      .optional()
      .or(z.literal('')),
    questType: QuestTypeSchema.optional(),
    target: z
      .string()
      .min(1, 'Target is required')
      .max(200, 'Target must be less than 200 characters')
      .trim()
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });
