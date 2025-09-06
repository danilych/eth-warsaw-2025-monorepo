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
  reward: z.bigint(),
  tokenAddress: z.string(),
  expiry: z.number(),
  fromAddress: z.string().nullable(),
  amount: z.string().nullable(), // Using string to handle numeric precision
  nftAddress: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
  deletedAt: z.string().nullable(),
});

export const UserQuestSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  questId: z.string().uuid(),
  status: QuestStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

export const QuestWithUserStatusSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  imageUrl: z.string().nullable(),
  questType: QuestTypeSchema,
  fromAddress: z.string().nullable(),
  amount: z.string().nullable(),
  nftAddress: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
  deletedAt: z.string().nullable(),
  reward: z.number(),
  tokenAddress: z.string(),
  expiry: z.number(),
  userStatus: z
    .object({
      id: z.string().uuid(),
      userId: z.string().uuid(),
      status: QuestStatusSchema,
      createdAt: z.string(),
      updatedAt: z.string().nullable(),
    })
    .nullable(),
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
  rewardTokenAddress: z
    .string()
    .min(1, 'Reward token address is required')
    .max(42, 'Reward token address must be less than 42 characters')
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Must be a valid Ethereum address'),
  fromAddress: z
    .string()
    .min(1, 'From address is required')
    .max(42, 'From address must be less than 42 characters')
    .trim(),
  toAddress: z
    .string()
    .min(1, 'To address is required')
    .max(42, 'To address must be less than 42 characters')
    .trim(),
  reward: z.string().transform((val) => {
    const ethAmount = Number.parseFloat(val);
    const weiAmount = ethAmount * 10 ** 18;
    return BigInt(Math.floor(weiAmount));
  }),
  expiry: z.number().int().min(0, 'Expiry must be a non-negative integer'),
  amount: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Must be a valid number')
    .optional(),
  tokenAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Must be a valid Ethereum address')
    .optional(),
  nftAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Must be a valid Ethereum address')
    .optional(),
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
    fromAddress: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, 'Must be a valid Ethereum address')
      .optional(),
    toAddress: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, 'Must be a valid Ethereum address')
      .optional(),
    amount: z
      .string()
      .regex(/^\d+(\.\d+)?$/, 'Must be a valid number')
      .optional(),
    tokenAddress: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, 'Must be a valid Ethereum address')
      .optional(),
    nftAddress: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, 'Must be a valid Ethereum address')
      .optional(),
    reward: z
      .string()
      .transform((val) => {
        const ethAmount = Number.parseFloat(val);
        const weiAmount = ethAmount * 10 ** 18;
        return BigInt(Math.floor(weiAmount));
      })
      .optional(),
    rewardTokenAddress: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, 'Must be a valid Ethereum address')
      .optional(),
    expiry: z
      .number()
      .int()
      .min(0, 'Expiry must be a non-negative integer')
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });
