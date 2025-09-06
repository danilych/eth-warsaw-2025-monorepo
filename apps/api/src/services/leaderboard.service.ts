import { desc, sql, and, isNull, eq } from 'drizzle-orm';
import { db } from '../databases/main-postgres';
import { users, userBalances } from '../databases/main-postgres/schema';
import { GolemDbService } from './golemdb.service';

export interface LeaderboardEntry {
  userId: string;
  walletAddress: string;
  balance: string; // User's total balance (earned tokens)
  rank: number;
  lastUpdated: number;
}

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  totalUsers: number;
  lastCalculated: number;
  validUntilBlock: number;
}

export namespace LeaderboardService {
  // BTL configuration for leaderboard cache
  // 1 BTL ≈ 2 minutes, so 30 blocks = 60 minutes (1 hour)
  const LEADERBOARD_BTL = 30; // 1 hour cache duration
  const TOP_USERS_LIMIT = 25; // Only store top 25 users

  // Removed complex scoring - now we simply rank by total rewards claimed

  /**
   * Fetch leaderboard data from database - ranked by user balance
   * Always returns top 25 users for GolemDB storage
   */
  export const calculateLeaderboard = async (): Promise<LeaderboardEntry[]> => {
    try {
      // Get users with their balances, ordered by balance (highest first)
      const userStats = await db
        .select({
          userId: users.id,
          walletAddress: users.walletAddress,
          balance: sql<string>`COALESCE(MAX(${userBalances.balance}), 0)`,
        })
        .from(users)
        .leftJoin(
          userBalances,
          and(eq(users.id, userBalances.userId), isNull(userBalances.deletedAt))
        )
        .where(isNull(users.deletedAt))
        .groupBy(users.id, users.walletAddress)
        .orderBy(desc(sql<string>`COALESCE(MAX(${userBalances.balance}), 0)`))
        .limit(TOP_USERS_LIMIT);

      // Create leaderboard entries with rankings
      const leaderboardEntries: LeaderboardEntry[] = userStats.map(
        (user, index) => ({
          userId: user.userId,
          walletAddress: user.walletAddress,
          balance: user.balance,
          rank: index + 1,
          lastUpdated: Date.now(),
        })
      );

      return leaderboardEntries;
    } catch (error) {
      console.error('Error calculating leaderboard:', error);
      throw error;
    }
  };

  /**
   * Store leaderboard in GolemDB with 1-hour BTL
   */
  export const storeLeaderboardInGolemDB = async (
    leaderboardData: LeaderboardData
  ): Promise<`0x${string}`> => {
    try {
      const entity = GolemDbService.createJsonEntity(
        leaderboardData,
        LEADERBOARD_BTL,
        [{ key: 'type', value: 'leaderboard' }]
      );

      const receipt = await GolemDbService.createEntity(entity);
      console.log(`Stored leaderboard in GolemDB: ${receipt.entityKey}`);

      return receipt.entityKey;
    } catch (error) {
      console.error('Error storing leaderboard in GolemDB:', error);
      throw error;
    }
  };

  /**
   * Retrieve leaderboard from GolemDB
   */
  export const getLeaderboardFromGolemDB =
    async (): Promise<LeaderboardData | null> => {
      try {
        const query = 'type = "leaderboard"';
        const results = await GolemDbService.queryEntities(query);

        if (results.length === 0) {
          return null;
        }

        // Get the most recent leaderboard
        const decodedResults = GolemDbService.decodeJsonFromResults(results);
        if (decodedResults.length === 0) {
          return null;
        }

        // Sort by last_calculated and get the most recent
        const sortedResults = (decodedResults as LeaderboardData[]).sort(
          (a, b) => b.lastCalculated - a.lastCalculated
        );

        return sortedResults[0];
      } catch (error) {
        console.error('Error retrieving leaderboard from GolemDB:', error);
        return null;
      }
    };

  /**
   * Generate and store a fresh leaderboard (top 25 users, 1-hour cache)
   */
  export const generateAndStoreLeaderboard = async (): Promise<{
    entityKey: `0x${string}`;
    data: LeaderboardData;
  }> => {
    try {
      console.log('Generating top 25 leaderboard...');

      // Calculate fresh leaderboard data (always top 25)
      const entries = await calculateLeaderboard();

      // Get current block to calculate validity
      const client = await GolemDbService.getClient();
      const currentBlock = await client
        .getRawClient()
        .httpClient.getBlockNumber();
      const validUntilBlock = Number(currentBlock) + LEADERBOARD_BTL;

      const leaderboardData: LeaderboardData = {
        entries,
        totalUsers: entries.length,
        lastCalculated: Date.now(),
        validUntilBlock,
      };

      // Store in GolemDB
      const entityKey = await storeLeaderboardInGolemDB(leaderboardData);

      console.log(
        `Generated and stored leaderboard with ${entries.length} entries (valid for 1 hour)`
      );

      return { entityKey, data: leaderboardData };
    } catch (error) {
      console.error('Error generating leaderboard:', error);
      throw error;
    }
  };

  /**
   * Get leaderboard with 1-hour caching logic
   */
  export const getLeaderboard = async (
    forceRefresh = false
  ): Promise<LeaderboardData> => {
    try {
      if (!forceRefresh) {
        // Try to get cached leaderboard from GolemDB
        const cachedLeaderboard = await getLeaderboardFromGolemDB();

        if (cachedLeaderboard) {
          // Check if cache is still valid (within 1 hour)
          const client = await GolemDbService.getClient();
          const currentBlock = await client
            .getRawClient()
            .httpClient.getBlockNumber();

          if (Number(currentBlock) < cachedLeaderboard.validUntilBlock) {
            console.log('Using cached leaderboard (valid for 1 hour)');
            return cachedLeaderboard;
          }

          console.log(
            'Cached leaderboard expired (1 hour), generating fresh data'
          );
        }
      }

      // Generate fresh leaderboard (top 25 users, 1-hour cache)
      const { data } = await generateAndStoreLeaderboard();
      return data;
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw error;
    }
  };

  /**
   * Get user's position in leaderboard (only top 25 users)
   */
  export const getUserPosition = async (
    userId: string
  ): Promise<{ rank: number; balance: string; totalUsers: number } | null> => {
    try {
      const leaderboard = await getLeaderboard(); // Get top 25 users
      const userEntry = leaderboard.entries.find(
        (entry) => entry.userId === userId
      );

      if (!userEntry) {
        // User is not in top 25
        return null;
      }

      return {
        rank: userEntry.rank,
        balance: userEntry.balance,
        totalUsers: leaderboard.totalUsers,
      };
    } catch (error) {
      console.error('Error getting user position:', error);
      return null;
    }
  };

  /**
   * Get leaderboard statistics
   */
  export const getLeaderboardStats = async (): Promise<{
    totalUsers: number;
    totalBalance: string;
    averageBalance: string;
  }> => {
    try {
      const stats = await db
        .select({
          totalUsers: sql<number>`COUNT(DISTINCT ${users.id})`,
          totalBalance: sql<string>`COALESCE(SUM(${userBalances.balance}), 0)`,
          averageBalance: sql<string>`COALESCE(AVG(${userBalances.balance}), 0)`,
        })
        .from(users)
        .leftJoin(
          userBalances,
          and(eq(users.id, userBalances.userId), isNull(userBalances.deletedAt))
        )
        .where(isNull(users.deletedAt));

      const result = stats[0];

      return {
        totalUsers: Number(result.totalUsers),
        totalBalance: result.totalBalance,
        averageBalance: result.averageBalance,
      };
    } catch (error) {
      console.error('Error getting leaderboard stats:', error);
      throw error;
    }
  };

  /**
   * Clean up expired leaderboards from GolemDB
   */
  export const cleanupExpiredLeaderboards = async (): Promise<void> => {
    try {
      console.log('Cleaning up expired leaderboards...');

      // Query all leaderboard entities
      const allLeaderboards = await GolemDbService.queryEntities(
        'type = "leaderboard"'
      );

      if (allLeaderboards.length === 0) {
        console.log('No leaderboards found to clean up');
        return;
      }

      const client = await GolemDbService.getClient();
      const currentBlock = await client
        .getRawClient()
        .httpClient.getBlockNumber();

      let cleanedCount = 0;

      for (const result of allLeaderboards) {
        try {
          const metadata = await GolemDbService.getEntityMetadata(
            result.entityKey
          );

          // If the entity is expired (current block > expiration block)
          if (Number(currentBlock) > Number(metadata.expiresAtBlock)) {
            await GolemDbService.deleteEntity(result.entityKey);
            cleanedCount++;
            console.log(`Cleaned up expired leaderboard: ${result.entityKey}`);
          }
        } catch (error) {
          console.error(
            `Error cleaning up leaderboard ${result.entityKey}:`,
            error
          );
        }
      }

      console.log(`Cleaned up ${cleanedCount} expired leaderboards`);
    } catch (error) {
      console.error('Error during leaderboard cleanup:', error);
    }
  };
}
