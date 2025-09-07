// biome-ignore lint/style/useImportType: <explanation>
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuestService } from '../services/quest.service';
import type { QuestWithUserStatus, QuestStatus, User } from '../types/api';
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
import { Trophy, Play, CheckCircle, Clock, Coins, Wallet } from 'lucide-react';
import { useUser } from '@civic/auth-web3/react';
import { AuthService } from '../services/auth.service';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { toast } from '../components/ui/use-toast';
import { Navigation } from '../components/navigation/Navigation';

const QuestsPage: React.FC = () => {
  const { user, isLoading, accessToken } = useUser();
  const { address } = useAccount();
  const [backendUser, setBackendUser] = useState<User | null>(null);
  const [isBackendUserLoading, setIsBackendUserLoading] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const navigate = useNavigate();
  const [quests, setQuests] = useState<QuestWithUserStatus[]>([]);
  const [startingQuest, setStartingQuest] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollingIntervals, setPollingIntervals] = useState<
    Map<string, NodeJS.Timeout>
  >(new Map());
  const [loading, setLoading] = useState(true);

  // Redirect to auth if not logged in
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (!user && !isLoading) {
      navigate('/auth');
      return;
    }
  }, [user, isLoading]);

  // Fetch quests
  useEffect(() => {
    const fetchQuests = async () => {
      if (!user || !accessToken) return;

      try {
        setLoading(true);
        const questsData = await QuestService.getUserQuests(
          user.id,
          accessToken
        );
        setQuests(questsData);
      } catch (err) {
        setError('Failed to load quests. Please try again.');
        console.error('Error fetching quests:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchUser = async () => {
      setIsBackendUserLoading(true);
      if (!user || !accessToken) {
        setIsBackendUserLoading(false);
        return;
      }

      try {
        const userData = await AuthService.getCurrentUser(accessToken);
        setBackendUser(userData);
      } catch (err) {
        console.error('Error fetching user:', err);
        setBackendUser(null);
      } finally {
        setIsBackendUserLoading(false);
      }
    };

    fetchUser();
    fetchQuests();
  }, [user, accessToken]);

  // Handle wallet connection and user creation
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    const handleWalletConnection = async () => {
      if (
        !user ||
        !address ||
        !accessToken ||
        backendUser ||
        isCreatingUser ||
        isBackendUserLoading
      ) {
        return;
      }

      try {
        setIsCreatingUser(true);
        const newUser = await AuthService.createUser({
          civicId: user.id,
          civicAddress: address,
          walletAddress: address,
          accessToken,
        });
        setBackendUser(newUser);
        toast({
          title: 'Welcome!',
          description: 'Your account has been created successfully.',
        });
      } catch (err) {
        console.error('Error creating user:', err);
        toast({
          title: 'Error',
          description: 'Failed to create account. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsCreatingUser(false);
      }
    };

    handleWalletConnection();
  }, [address]);

  const handleStartQuest = async (questId: string) => {
    if (!user || !accessToken) return;

    console.log(user);

    try {
      setStartingQuest(questId);

      // Start the quest
      await QuestService.startQuest(questId, user.id, accessToken);

      // Update local state
      setQuests((prev) =>
        prev.map((quest) =>
          quest.id === questId
            ? {
                ...quest,
                userStatus: {
                  id: `temp-${questId}`,
                  userId: user.id,
                  status: 'IN_PROGRESS' as QuestStatus,
                  createdAt: new Date().toISOString(),
                  updatedAt: null,
                },
              }
            : quest
        )
      );

      // Start polling for quest status
      startQuestStatusPolling(questId);
    } catch (err) {
      setError('Failed to start quest. Please try again.');
      console.error('Error starting quest:', err);
    } finally {
      setStartingQuest(null);
    }
  };

  const startQuestStatusPolling = (questId: string) => {
    if (!user || !accessToken) return;

    // Clear existing interval if any
    const existingInterval = pollingIntervals.get(questId);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    // Start new polling interval
    const interval = setInterval(async () => {
      try {
        const status = await QuestService.getQuestStatus(
          questId,
          user.id,
          accessToken
        );

        if (status === 'COMPLETED') {
          // Clear interval and update quest status
          clearInterval(interval);
          setPollingIntervals((prev) => {
            const newMap = new Map(prev);
            newMap.delete(questId);
            return newMap;
          });

          // Update quest status to completed
          setQuests((prev) =>
            prev.map((quest) =>
              quest.id === questId && quest.userStatus
                ? {
                    ...quest,
                    userStatus: {
                      ...quest.userStatus,
                      status: 'COMPLETED' as QuestStatus,
                      updatedAt: new Date().toISOString(),
                    },
                  }
                : quest
            )
          );
        }
      } catch (err) {
        console.error('Error polling quest status:', err);
      }
    }, 5000); // Poll every 5 seconds

    // Store interval reference
    setPollingIntervals((prev) => new Map(prev).set(questId, interval));
  };

  const handleClaimQuest = async (questId: string) => {
    if (!accessToken) return;

    try {
      setStartingQuest(questId);
      await QuestService.claimQuest(questId, accessToken);

      // Update quest status to claimed or remove from list
      setQuests((prev) =>
        prev.map((quest) =>
          quest.id === questId && quest.userStatus
            ? {
                ...quest,
                userStatus: {
                  ...quest.userStatus,
                  status: 'CLAIMED' as QuestStatus,
                  updatedAt: new Date().toISOString(),
                },
              }
            : quest
        )
      );
    } catch (err) {
      setError('Failed to claim quest. Please try again.');
      console.error('Error claiming quest:', err);
    } finally {
      setStartingQuest(null);
    }
  };

  // Cleanup intervals on unmount
  // biome-ignore lint/correctness/useExhaustiveDependencies: cleanup effect
  useEffect(() => {
    return () => {
      for (const interval of pollingIntervals.values()) {
        clearInterval(interval);
      }
    };
  }, []);

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
            onClick={() => handleClaimQuest(quest.id)}
            disabled={startingQuest === quest.id}
            className="bg-gradient-to-r from-quest-gold to-neon-cyan hover:from-quest-gold/80 hover:to-neon-cyan/80 text-black border-0"
          >
            {startingQuest === quest.id ? (
              <>Loading...</>
            ) : (
              <>
                <Trophy className="w-4 h-4 mr-2" />
                Claim Reward
              </>
            )}
          </Button>
        );
      case 'CLAIMED':
        return (
          <Button
            variant="outline"
            disabled
            className="border-neon-green/30 text-neon-green"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Claimed
          </Button>
        );
      default:
        return null;
    }
  };

  if (loading || isBackendUserLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <Skeleton className="h-12 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }, () => (
              <Skeleton key={crypto.randomUUID()} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show wallet connect UI if user is authenticated but backend user doesn't exist
  if (user && !backendUser && !isCreatingUser) {
    return (
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/10 via-background to-neon-purple/10" />

          <div className="relative z-10 container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-6 animate-float">
              <Wallet className="w-4 h-4 text-neon-blue" />
              <span className="text-sm text-muted-foreground">
                Connect Your Wallet
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              <span className="gradient-text bg-gradient-to-r from-neon-blue via-neon-purple to-neon-cyan bg-clip-text text-transparent">
                Connect Your Wallet
              </span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Connect your Web3 wallet to access quests and start earning{' '}
              <span className="text-quest-gold font-semibold">USDT</span>{' '}
              rewards
            </p>

            <Card className="w-full max-w-md mx-auto glass border-neon-blue/20">
              <CardContent className="p-8">
                <div className="flex flex-col items-center space-y-4">
                  <Wallet className="w-12 h-12 text-neon-blue" />
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">
                      Connect Wallet
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Connect your wallet to create your account and access
                      quests
                    </p>
                  </div>
                  <ConnectButton.Custom>
                    {({
                      account,
                      chain,
                      openAccountModal,
                      openChainModal,
                      openConnectModal,
                      authenticationStatus,
                      mounted,
                    }) => {
                      const ready =
                        mounted && authenticationStatus !== 'loading';
                      const connected =
                        ready &&
                        account &&
                        chain &&
                        (!authenticationStatus ||
                          authenticationStatus === 'authenticated');

                      return (
                        <div
                          {...(!ready && {
                            'aria-hidden': true,
                            style: {
                              opacity: 0,
                              pointerEvents: 'none',
                              userSelect: 'none',
                            },
                          })}
                        >
                          {(() => {
                            if (!connected) {
                              return (
                                <Button
                                  onClick={openConnectModal}
                                  className="bg-gradient-to-r from-neon-blue to-neon-purple hover:from-neon-blue/80 hover:to-neon-purple/80 text-white border-0 w-full"
                                  size="lg"
                                >
                                  <Wallet className="w-4 h-4 mr-2" />
                                  Connect Wallet
                                </Button>
                              );
                            }

                            if (chain.unsupported) {
                              return (
                                <Button
                                  onClick={openChainModal}
                                  variant="destructive"
                                  size="lg"
                                  className="w-full"
                                >
                                  Wrong network
                                </Button>
                              );
                            }

                            return (
                              <div className="flex flex-col items-center space-y-2">
                                <Button
                                  onClick={openAccountModal}
                                  variant="outline"
                                  className="border-neon-blue/30 text-neon-blue"
                                >
                                  {account.displayName}
                                  {account.displayBalance
                                    ? ` (${account.displayBalance})`
                                    : ''}
                                </Button>
                                {isCreatingUser && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <div className="w-4 h-4 border-2 border-neon-blue/30 border-t-neon-blue rounded-full animate-spin" />
                                    Creating account...
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      );
                    }}
                  </ConnectButton.Custom>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      {user && backendUser && (
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
                      {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
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
