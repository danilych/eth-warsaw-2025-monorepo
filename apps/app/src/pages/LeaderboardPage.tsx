// biome-ignore lint/style/useImportType: <explanation>
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LeaderboardService } from '../services/leaderboard.service';
import type {
  LeaderboardData,
  LeaderboardStats,
  UserPosition,
} from '../services/leaderboard.service';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import {
  Trophy,
  Crown,
  Medal,
  Users,
  Coins,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { useUser } from '@civic/auth-web3/react';
import { Navigation } from '../components/navigation/Navigation';

const LeaderboardPage: React.FC = () => {
  const { user, isAuthenticated, isLoading, accessToken } = useUser();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
  }, [user, navigate]);

  // Fetch leaderboard data
  const fetchLeaderboardData = useCallback(
    async (forceRefresh = false) => {
      try {
        if (!accessToken) return;
        if (forceRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const [leaderboardData, statsData, userPos] = await Promise.all([
          LeaderboardService.getLeaderboard(forceRefresh, accessToken),
          LeaderboardService.getLeaderboardStats(accessToken),
          user
            ? LeaderboardService.getCurrentUserPosition(accessToken)
            : Promise.resolve(null),
        ]);

        setLeaderboard(leaderboardData);
        setStats(statsData);
        setUserPosition(userPos);
        setError(null);
      } catch (err) {
        setError('Failed to load leaderboard. Please try again.');
        console.error('Error fetching leaderboard:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user, accessToken]
  );

  useEffect(() => {
    if (user) {
      fetchLeaderboardData();
    }
  }, [user, fetchLeaderboardData]);

  const handleRefresh = () => {
    fetchLeaderboardData(true);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-300" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <Trophy className="w-6 h-6 text-cyan-400" />;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30';
      case 2:
        return 'bg-gray-300/20 text-gray-300 border-gray-300/30';
      case 3:
        return 'bg-amber-600/20 text-amber-600 border-amber-600/30';
      default:
        return 'bg-cyan-400/20 text-cyan-400 border-cyan-400/30';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <Skeleton className="h-12 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={`stats-skeleton-${i}`} className="h-24 w-full" />
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton
                key={`leaderboard-skeleton-${i}`}
                className="h-20 w-full"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      {user && (
        <div className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4 flex justify-center">
            <Navigation />
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/10 via-background to-neon-purple/10" />

        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-6 animate-float">
            <Trophy className="w-4 h-4 text-quest-gold" />
            <span className="text-sm text-muted-foreground">
              Web3 Quest Platform
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="gradient-text bg-gradient-to-r from-neon-blue via-neon-purple to-neon-cyan bg-clip-text text-transparent">
              Leaderboard
            </span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            See how you rank against other{' '}
            <span className="text-quest-gold font-semibold">
              quest warriors
            </span>{' '}
            and compete for the top spot
          </p>

          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-gradient-to-r from-neon-blue to-neon-purple hover:from-neon-blue/80 hover:to-neon-purple/80 text-white border-0"
          >
            {refreshing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </>
            )}
          </Button>
        </div>
      </section>

      {/* Stats Section */}
      {stats && (
        <section className="container mx-auto px-4 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="glass border-neon-blue/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-neon-blue" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-neon-blue">
                  {stats.totalUsers.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-neon-purple/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Rewards
                </CardTitle>
                <Coins className="h-4 w-4 text-quest-gold" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-quest-gold">
                  {LeaderboardService.formatBalance(stats.totalBalance)} USDT
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-neon-green/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Average Balance
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-neon-green" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-neon-green">
                  {LeaderboardService.formatBalance(stats.averageBalance)} USDT
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* User Position Section */}
      {userPosition && (
        <section className="container mx-auto px-4 mb-12">
          <Card className="glass border-quest-gold/20 bg-gradient-to-r from-quest-gold/5 to-neon-cyan/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-quest-gold" />
                Your Position
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {getRankIcon(userPosition.rank)}
                  <div>
                    <div className="text-2xl font-bold">
                      {LeaderboardService.getRankDisplay(userPosition.rank)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      out of {userPosition.totalUsers} users
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-quest-gold">
                    {LeaderboardService.formatBalance(userPosition.balance)}{' '}
                    USDT
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Earned
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Leaderboard Section */}
      <section className="container mx-auto px-4 pb-20">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-center">
            {error}
          </div>
        )}

        {leaderboard && leaderboard.entries.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              No Rankings Available
            </h3>
            <p className="text-muted-foreground">
              Complete quests to appear on the leaderboard!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Top 25 Quest Warriors</h2>
              {leaderboard && (
                <div className="text-sm text-muted-foreground">
                  Last updated:{' '}
                  {new Date(leaderboard.lastCalculated).toLocaleString()}
                </div>
              )}
            </div>

            {leaderboard?.entries.map((entry) => (
              <Card
                key={entry.userId}
                className={`glass transition-all duration-300 ${
                  entry.rank <= 3
                    ? 'border-quest-gold/30 hover:border-quest-gold/50'
                    : 'border-neon-blue/20 hover:border-neon-blue/40'
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className="flex items-center gap-2">
                        {getRankIcon(entry.rank)}
                        <Badge
                          variant="secondary"
                          className={getRankBadgeColor(entry.rank)}
                        >
                          #{entry.rank}
                        </Badge>
                      </div>

                      {/* User Info */}
                      <div>
                        <div className="font-mono text-sm text-muted-foreground">
                          {entry.walletAddress.slice(0, 6)}...
                          {entry.walletAddress.slice(-4)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Last updated:{' '}
                          {new Date(entry.lastUpdated).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Balance */}
                    <div className="text-right">
                      <div className="text-xl font-bold text-quest-gold">
                        {LeaderboardService.formatBalance(entry.balance)} USDT
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Earned
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default LeaderboardPage;
