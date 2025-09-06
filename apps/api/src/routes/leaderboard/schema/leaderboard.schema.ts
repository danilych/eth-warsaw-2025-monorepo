import { z } from 'zod';

export const LeaderboardEntrySchema = z.object({
  userId: z.string().uuid(),
  walletAddress: z.string(),
  balance: z.string(), // User's total balance (earned tokens)
  rank: z.number().int().min(1),
  lastUpdated: z.number().int(),
});

export const LeaderboardDataSchema = z.object({
  entries: z.array(LeaderboardEntrySchema),
  totalUsers: z.number().int().min(0),
  lastCalculated: z.number().int(),
  validUntilBlock: z.number().int(),
});

export const LeaderboardQuerySchema = z.object({
  forceRefresh: z.string().optional().default('false'),
});

export const UserPositionSchema = z.object({
  rank: z.number().int().min(1),
  balance: z.string(),
  totalUsers: z.number().int().min(0),
});

export const LeaderboardStatsSchema = z.object({
  totalUsers: z.number().int().min(0),
  totalBalance: z.string(),
  averageBalance: z.string(),
});

export const BTLConfigSchema = z.object({
  GLOBAL: z.number().int().positive(),
  DAILY: z.number().int().positive(),
  WEEKLY: z.number().int().positive(),
  MONTHLY: z.number().int().positive(),
});

export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;
export type LeaderboardData = z.infer<typeof LeaderboardDataSchema>;
export type LeaderboardQuery = z.infer<typeof LeaderboardQuerySchema>;
export type UserPosition = z.infer<typeof UserPositionSchema>;
export type LeaderboardStats = z.infer<typeof LeaderboardStatsSchema>;
export type BTLConfig = z.infer<typeof BTLConfigSchema>;
