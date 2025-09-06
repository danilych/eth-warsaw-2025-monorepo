import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Clock, 
  Coins, 
  TrendingUp, 
  Zap, 
  Star,
  ArrowRight,
  Filter,
  Search
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { QuestService } from '../services/quest.service';
import { LoginButton, UserProfileButton } from '../components/ui/AuthButtons';
import type { Quest, QuestWithUserStatus, QuestType } from '../types/api';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user, dbUser, isLoading } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [userQuests, setUserQuests] = useState<QuestWithUserStatus[]>([]);
  const [isLoadingQuests, setIsLoadingQuests] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadQuests();
  }, []);

  useEffect(() => {
    if (dbUser?.id) {
      loadUserQuests();
    }
  }, [dbUser]);

  const loadQuests = async () => {
    try {
      setIsLoadingQuests(true);
      const fetchedQuests = await QuestService.getAllQuests();
      setQuests(fetchedQuests);
    } catch (error) {
      console.error('Failed to load quests:', error);
    } finally {
      setIsLoadingQuests(false);
    }
  };

  const loadUserQuests = async () => {
    if (!dbUser?.id) return;
    
    try {
      const fetchedUserQuests = await QuestService.getUserQuests(dbUser.id);
      setUserQuests(fetchedUserQuests);
    } catch (error) {
      console.error('Failed to load user quests:', error);
    }
  };


  const getQuestTypeColor = (questType: QuestType) => {
    const colors = {
      SEND_ERC20: 'bg-neon-blue/20 text-neon-blue border-neon-blue/30',
      RECEIVE_ERC20: 'bg-neon-purple/20 text-neon-purple border-neon-purple/30',
      SEND_NFT: 'bg-neon-pink/20 text-neon-pink border-neon-pink/30',
      RECEIVE_NFT: 'bg-neon-green/20 text-neon-green border-neon-green/30',
    };
    return colors[questType] || 'bg-muted text-muted-foreground';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      IN_PROGRESS: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      COMPLETED: 'bg-green-500/20 text-green-400 border-green-500/30',
      CLAIM: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    };
    return colors[status] || 'bg-muted text-muted-foreground';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-neon-blue border-t-transparent rounded-full animate-spin" />
          <span className="text-lg">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md glass border-neon-blue/20">
          <CardHeader className="text-center">
            <Trophy className="w-12 h-12 mx-auto text-neon-blue mb-4" />
            <CardTitle className="text-2xl gradient-text bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">
              Welcome to Quest Platform
            </CardTitle>
            <CardDescription>
              Connect your wallet to start earning rewards from Web3 quests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginButton variant="hero" size="lg" className="w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }


  const completedQuests = userQuests.filter(q => q.userStatus?.status === 'COMPLETED').length;
  const totalRewards = userQuests
    .filter(q => q.userStatus?.status === 'COMPLETED')
    .reduce((sum, q) => sum + Number(q.reward), 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 glass backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold gradient-text bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">
                Quest Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <UserProfileButton />
              <LoginButton />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="glass border-neon-blue/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-neon-blue/20">
                  <Trophy className="w-6 h-6 text-neon-blue" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neon-blue">{completedQuests}</p>
                  <p className="text-sm text-muted-foreground">Completed Quests</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-neon-purple/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-neon-purple/20">
                  <Coins className="w-6 h-6 text-neon-purple" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neon-purple">
                    {QuestService.formatReward(BigInt(totalRewards))} USDT
                  </p>
                  <p className="text-sm text-muted-foreground">Total Rewards</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-neon-cyan/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-neon-cyan/20">
                  <TrendingUp className="w-6 h-6 text-neon-cyan" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neon-cyan">{userQuests.length}</p>
                  <p className="text-sm text-muted-foreground">Active Quests</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-neon-green/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-neon-green/20">
                  <Star className="w-6 h-6 text-neon-green" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neon-green">
                    {completedQuests > 0 ? Math.round((completedQuests / userQuests.length) * 100) : 0}%
                  </p>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quest Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="glass">
              <TabsTrigger value="all">All Quests</TabsTrigger>
              <TabsTrigger value="active">My Quests</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="glass">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm" className="glass">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
          </div>

          <TabsContent value="all" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoadingQuests ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="glass animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-muted rounded mb-4" />
                      <div className="h-3 bg-muted rounded mb-2" />
                      <div className="h-3 bg-muted rounded w-2/3" />
                    </CardContent>
                  </Card>
                ))
              ) : (
                quests.map((quest) => (
                  <Card key={quest.id} className="glass border-border/50 hover:border-neon-blue/30 transition-colors group">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <Badge className={getQuestTypeColor(quest.questType)}>
                          {QuestService.getQuestTypeDisplayName(quest.questType)}
                        </Badge>
                        <div className="text-right">
                          <p className="text-sm font-medium text-quest-gold">
                            {QuestService.formatReward(quest.reward)} USDT
                          </p>
                          <p className="text-xs text-muted-foreground">Reward</p>
                        </div>
                      </div>
                      <CardTitle className="text-lg">{quest.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {quest.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {QuestService.isQuestExpired(quest.expiry) ? (
                            <span className="text-red-400">Expired</span>
                          ) : (
                            <span>
                              Expires {new Date(quest.expiry * 1000).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <Link to={`/quest/${quest.id}`}>
                          <Button size="sm" className="group-hover:translate-x-1 transition-transform">
                            View Quest
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="active" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userQuests
                .filter(q => q.userStatus?.status !== 'COMPLETED')
                .map((quest) => (
                  <Card key={quest.id} className="glass border-border/50 hover:border-neon-purple/30 transition-colors group">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <Badge className={getQuestTypeColor(quest.questType)}>
                            {QuestService.getQuestTypeDisplayName(quest.questType)}
                          </Badge>
                          {quest.userStatus && (
                            <Badge className={getStatusColor(quest.userStatus.status)}>
                              {quest.userStatus.status.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-quest-gold">
                            {QuestService.formatReward(BigInt(quest.reward))} USDT
                          </p>
                          <p className="text-xs text-muted-foreground">Reward</p>
                        </div>
                      </div>
                      <CardTitle className="text-lg">{quest.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {quest.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Zap className="w-4 h-4" />
                          <span>In Progress</span>
                        </div>
                        <Link to={`/quest/${quest.id}`}>
                          <Button size="sm" variant="outline" className="group-hover:translate-x-1 transition-transform">
                            Continue
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userQuests
                .filter(q => q.userStatus?.status === 'COMPLETED')
                .map((quest) => (
                  <Card key={quest.id} className="glass border-neon-green/20 hover:border-neon-green/40 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <Badge className={getQuestTypeColor(quest.questType)}>
                            {QuestService.getQuestTypeDisplayName(quest.questType)}
                          </Badge>
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            ✓ Completed
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-quest-gold">
                            +{QuestService.formatReward(BigInt(quest.reward))} USDT
                          </p>
                          <p className="text-xs text-muted-foreground">Earned</p>
                        </div>
                      </div>
                      <CardTitle className="text-lg">{quest.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {quest.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-green-400">
                          <Trophy className="w-4 h-4" />
                          <span>
                            Completed {quest.userStatus?.updatedAt ? 
                              new Date(quest.userStatus.updatedAt).toLocaleDateString() : 
                              'Recently'
                            }
                          </span>
                        </div>
                        <Link to={`/quest/${quest.id}`}>
                          <Button size="sm" variant="ghost">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
