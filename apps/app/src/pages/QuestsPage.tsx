// biome-ignore lint/style/useImportType: <explanation>
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { QuestService } from '../services/quest.service';
import type { QuestWithUserStatus, QuestStatus } from '../types/api';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Trophy, Play, CheckCircle, Clock, Coins } from 'lucide-react';

const QuestsPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [quests, setQuests] = useState<QuestWithUserStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingQuest, setStartingQuest] = useState<string | null>(null);

  // Redirect to auth if not logged in
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  //   useEffect(() => {
  //     if (!user && !isLoading) {
  //       navigate('/auth');
  //       return;
  //     }
  //   }, [user, isLoading]);

  // Fetch quests
  useEffect(() => {
    const fetchQuests = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const questsData = await QuestService.getUserQuests(user.id);
        setQuests(questsData);
      } catch (err) {
        setError('Failed to load quests. Please try again.');
        console.error('Error fetching quests:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuests();
  }, [user]);

  const handleStartQuest = async (questId: string) => {
    try {
      setStartingQuest(questId);
      // Note: startQuest method not available in current service
      // This would need to be implemented in the backend
      console.log('Starting quest:', questId);

      // Update local state
      setQuests((prev) =>
        prev.map((quest) =>
          quest.id === questId
            ? {
                ...quest,
                userStatus: {
                  id: `temp-${questId}`,
                  userId: user?.id || '',
                  status: 'IN_PROGRESS' as QuestStatus,
                  createdAt: new Date().toISOString(),
                  updatedAt: null,
                },
              }
            : quest
        )
      );
    } catch (err) {
      console.error('Error starting quest:', err);
      setError('Failed to start quest. Please try again.');
    } finally {
      setStartingQuest(null);
    }
  };

  const getStatusBadge = (status: QuestStatus | null) => {
    if (!status) {
      return <Badge variant="outline">Not Started</Badge>;
    }

    switch (status) {
      case 'IN_PROGRESS':
        return (
          <Badge
            variant="secondary"
            className="bg-neon-blue/20 text-neon-blue border-neon-blue/30"
          >
            <Clock className="w-3 h-3 mr-1" />
            In Progress
          </Badge>
        );
      case 'COMPLETED':
        return (
          <Badge
            variant="secondary"
            className="bg-neon-green/20 text-neon-green border-neon-green/30"
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case 'CLAIM':
        return (
          <Badge
            variant="secondary"
            className="bg-quest-gold/20 text-quest-gold border-quest-gold/30"
          >
            <Trophy className="w-3 h-3 mr-1" />
            Ready to Claim
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getActionButton = (quest: QuestWithUserStatus) => {
    const status = quest.userStatus?.status;

    if (!status) {
      return (
        <Button
          onClick={() => handleStartQuest(quest.id)}
          disabled={startingQuest === quest.id}
          className="bg-gradient-to-r from-neon-blue to-neon-purple hover:from-neon-blue/80 hover:to-neon-purple/80 text-white border-0"
        >
          {startingQuest === quest.id ? (
            <>Loading...</>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Start Quest
            </>
          )}
        </Button>
      );
    }

    switch (status) {
      case 'IN_PROGRESS':
        return (
          <Button
            variant="outline"
            disabled
            className="border-neon-blue/30 text-neon-blue"
          >
            <Clock className="w-4 h-4 mr-2" />
            In Progress
          </Button>
        );
      case 'COMPLETED':
        return (
          <Button
            variant="outline"
            disabled
            className="border-neon-green/30 text-neon-green"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Completed
          </Button>
        );
      case 'CLAIM':
        return (
          <Button className="bg-gradient-to-r from-quest-gold to-neon-cyan hover:from-quest-gold/80 hover:to-neon-cyan/80 text-black border-0">
            <Trophy className="w-4 h-4 mr-2" />
            Claim Reward
          </Button>
        );
      default:
        return null;
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
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
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
              Available Quests
            </span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Complete quests to earn{' '}
            <span className="text-quest-gold font-semibold">USDT</span> rewards
            and unlock exclusive benefits
          </p>
        </div>
      </section>

      {/* Quests Section */}
      <section className="container mx-auto px-4 pb-20">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-center">
            {error}
          </div>
        )}

        {quests.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Quests Available</h3>
            <p className="text-muted-foreground">
              Check back later for new quests!
            </p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {quests.map((quest) => (
              <AccordionItem
                key={quest.id}
                value={quest.id}
                className="border-0"
              >
                <Card className="glass border-neon-blue/20 hover:border-neon-blue/40 transition-all duration-300">
                  <AccordionTrigger className="hover:no-underline p-0">
                    <CardHeader className="flex-row items-center space-y-0 space-x-4 w-full">
                      {/* Quest Image */}
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 flex items-center justify-center flex-shrink-0">
                        {quest.imageUrl ? (
                          <img
                            src={quest.imageUrl}
                            alt={quest.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Trophy className="w-8 h-8 text-neon-blue" />
                        )}
                      </div>

                      {/* Quest Info */}
                      <div className="flex-1 text-left">
                        <CardTitle className="text-lg mb-1">
                          {quest.name}
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Coins className="w-4 h-4 text-quest-gold" />
                            {QuestService.formatReward(quest.reward)} USDT
                          </span>
                          {getStatusBadge(quest.userStatus?.status || null)}
                        </div>
                      </div>

                      {/* Action Button */}
                      <div
                        className="flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {getActionButton(quest)}
                      </div>
                    </CardHeader>
                  </AccordionTrigger>

                  <AccordionContent>
                    <CardContent className="pt-0">
                      <div className="border-t border-border/50 pt-4">
                        <CardDescription className="text-base leading-relaxed">
                          {quest.description}
                        </CardDescription>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              Quest Type:
                            </span>
                            <span className="ml-2 font-medium">
                              {QuestService.getQuestTypeDisplayName(
                                quest.questType
                              )}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Target:
                            </span>
                            <span className="ml-2 font-mono text-xs">
                              {quest.target}
                            </span>
                          </div>
                          {quest.amount && (
                            <div>
                              <span className="text-muted-foreground">
                                Amount:
                              </span>
                              <span className="ml-2 font-medium">
                                {quest.amount}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </section>
    </div>
  );
};

export default QuestsPage;
