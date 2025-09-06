import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Clock, 
  Coins, 
  Trophy, 
  Zap, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Copy,
  Wallet
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { QuestService } from '../services/quest.service';
import type { Quest, QuestWithUserStatus, ClaimQuestResponse } from '../types/api';
import { toast } from 'sonner';

export default function QuestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, dbUser } = useAuth();
  
  const [quest, setQuest] = useState<Quest | null>(null);
  const [userQuest, setUserQuest] = useState<QuestWithUserStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimData, setClaimData] = useState<ClaimQuestResponse | null>(null);

  useEffect(() => {
    if (id) {
      loadQuest();
    }
  }, [id, dbUser]);

  const loadQuest = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      const fetchedQuest = await QuestService.getQuestById(id);
      setQuest(fetchedQuest);

      // Load user quest status if user is authenticated
      if (dbUser?.id) {
        try {
          const fetchedUserQuest = await QuestService.getUserQuest(id, dbUser.id);
          setUserQuest(fetchedUserQuest);
        } catch (error) {
          // User quest might not exist yet
          console.log('User quest not found, user hasn\'t started this quest yet');
        }
      }
    } catch (error) {
      console.error('Failed to load quest:', error);
      toast.error('Failed to load quest details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimQuest = async () => {
    if (!id || !user) return;

    try {
      setIsClaiming(true);
      const claimResponse = await QuestService.claimQuest(id);
      setClaimData(claimResponse);
      toast.success('Quest claimed successfully! Signature generated.');
      
      // Reload quest data to update status
      await loadQuest();
    } catch (error) {
      console.error('Failed to claim quest:', error);
      toast.error('Failed to claim quest. Please try again.');
    } finally {
      setIsClaiming(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getQuestTypeColor = (questType: string) => {
    const colors = {
      TRANSFER: 'bg-neon-blue/20 text-neon-blue border-neon-blue/30',
      SWAP: 'bg-neon-purple/20 text-neon-purple border-neon-purple/30',
      NFT_MINT: 'bg-neon-pink/20 text-neon-pink border-neon-pink/30',
      STAKE: 'bg-neon-green/20 text-neon-green border-neon-green/30',
      BRIDGE: 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30',
    };
    return colors[questType] || 'bg-muted text-muted-foreground';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      IN_PROGRESS: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      COMPLETED: 'bg-green-500/20 text-green-400 border-green-500/30',
      FAILED: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return colors[status] || 'bg-muted text-muted-foreground';
  };

  const getProgressValue = () => {
    if (!userQuest?.userStatus) return 0;
    
    switch (userQuest.userStatus.status) {
      case 'PENDING': return 25;
      case 'IN_PROGRESS': return 75;
      case 'COMPLETED': return 100;
      case 'FAILED': return 0;
      default: return 0;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-neon-blue border-t-transparent rounded-full animate-spin" />
          <span className="text-lg">Loading quest details...</span>
        </div>
      </div>
    );
  }

  if (!quest) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md glass border-red-500/20">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
            <CardTitle className="text-xl text-red-400">Quest Not Found</CardTitle>
            <CardDescription>
              The quest you're looking for doesn't exist or has been removed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired = QuestService.isQuestExpired(quest.expiry);
  const isCompleted = userQuest?.userStatus?.status === 'COMPLETED';
  const canClaim = user && dbUser && !isCompleted && !isExpired;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 glass backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold gradient-text bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">
                Quest Details
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Quest Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass border-border/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Badge className={getQuestTypeColor(quest.questType)}>
                        {QuestService.getQuestTypeDisplayName(quest.questType)}
                      </Badge>
                      {userQuest?.userStatus && (
                        <Badge className={getStatusColor(userQuest.userStatus.status)}>
                          {userQuest.userStatus.status.replace('_', ' ')}
                        </Badge>
                      )}
                      {isExpired && (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                          Expired
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-3xl">{quest.name}</CardTitle>
                    <CardDescription className="text-lg">
                      {quest.description}
                    </CardDescription>
                  </div>
                  {quest.imageUrl && (
                    <img 
                      src={quest.imageUrl} 
                      alt={quest.name}
                      className="w-20 h-20 rounded-lg object-cover border border-border/50"
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Progress Bar */}
                {userQuest?.userStatus && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{getProgressValue()}%</span>
                    </div>
                    <Progress value={getProgressValue()} className="h-2" />
                  </div>
                )}

                {/* Quest Requirements */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Quest Requirements</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {quest.fromAddress && (
                      <div className="p-4 rounded-lg glass border border-border/50">
                        <p className="text-sm text-muted-foreground mb-1">From Address</p>
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono bg-muted/50 px-2 py-1 rounded">
                            {quest.fromAddress.slice(0, 6)}...{quest.fromAddress.slice(-4)}
                          </code>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => copyToClipboard(quest.fromAddress!)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {quest.amount && (
                      <div className="p-4 rounded-lg glass border border-border/50">
                        <p className="text-sm text-muted-foreground mb-1">Amount</p>
                        <p className="font-medium">{quest.amount} ETH</p>
                      </div>
                    )}

                    {quest.tokenAddress && (
                      <div className="p-4 rounded-lg glass border border-border/50">
                        <p className="text-sm text-muted-foreground mb-1">Token Contract</p>
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono bg-muted/50 px-2 py-1 rounded">
                            {quest.tokenAddress.slice(0, 6)}...{quest.tokenAddress.slice(-4)}
                          </code>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => copyToClipboard(quest.tokenAddress!)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {quest.nftAddress && (
                      <div className="p-4 rounded-lg glass border border-border/50">
                        <p className="text-sm text-muted-foreground mb-1">NFT Contract</p>
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono bg-muted/50 px-2 py-1 rounded">
                            {quest.nftAddress.slice(0, 6)}...{quest.nftAddress.slice(-4)}
                          </code>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => copyToClipboard(quest.nftAddress!)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Claim Signature */}
                {claimData && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-green-400">Quest Claimed Successfully!</h3>
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                      <p className="text-sm text-muted-foreground mb-2">Signature for blockchain verification:</p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono bg-muted/50 px-2 py-1 rounded flex-1 break-all">
                          {claimData.signature}
                        </code>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => copyToClipboard(claimData.signature)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Use this signature to claim your reward on the blockchain.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Reward Card */}
            <Card className="glass border-quest-gold/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-quest-gold/20">
                    <Coins className="w-6 h-6 text-quest-gold" />
                  </div>
                  <div>
                    <CardTitle className="text-quest-gold">
                      {QuestService.formatReward(quest.reward)} USDT
                    </CardTitle>
                    <CardDescription>Reward Amount</CardDescription>
                  </div>
                </div>
              </CardHeader>
              {canClaim && (
                <CardContent>
                  <Button 
                    onClick={handleClaimQuest}
                    disabled={isClaiming}
                    className="w-full bg-gradient-to-r from-quest-gold to-neon-green hover:from-quest-gold/80 hover:to-neon-green/80 text-black font-semibold"
                    size="lg"
                  >
                    {isClaiming ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        Claiming...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5" />
                        Claim Quest
                      </div>
                    )}
                  </Button>
                </CardContent>
              )}
            </Card>

            {/* Quest Info */}
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Quest Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Expires</span>
                  </div>
                  <span className={`text-sm font-medium ${isExpired ? 'text-red-400' : 'text-foreground'}`}>
                    {new Date(quest.expiry * 1000).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Zap className="w-4 h-4" />
                    <span>Type</span>
                  </div>
                  <span className="text-sm font-medium">
                    {QuestService.getQuestTypeDisplayName(quest.questType)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Wallet className="w-4 h-4" />
                    <span>Reward Token</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono bg-muted/50 px-2 py-1 rounded">
                      {quest.tokenAddress.slice(0, 6)}...{quest.tokenAddress.slice(-4)}
                    </code>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => copyToClipboard(quest.tokenAddress)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {userQuest?.userStatus && (
                  <>
                    <hr className="border-border/50" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4" />
                        <span>Started</span>
                      </div>
                      <span className="text-sm font-medium">
                        {new Date(userQuest.userStatus.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {userQuest.userStatus.updatedAt && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>Last Updated</span>
                        </div>
                        <span className="text-sm font-medium">
                          {new Date(userQuest.userStatus.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            {!user && (
              <Card className="glass border-neon-blue/20">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect your wallet to participate in this quest
                  </p>
                  <Button className="w-full" onClick={() => navigate('/dashboard')}>
                    Connect Wallet
                  </Button>
                </CardContent>
              </Card>
            )}

            {isCompleted && (
              <Card className="glass border-green-500/20">
                <CardContent className="p-6 text-center">
                  <Trophy className="w-12 h-12 mx-auto text-green-400 mb-4" />
                  <p className="font-semibold text-green-400 mb-2">Quest Completed!</p>
                  <p className="text-sm text-muted-foreground">
                    You've successfully completed this quest and earned your reward.
                  </p>
                </CardContent>
              </Card>
            )}

            {isExpired && !isCompleted && (
              <Card className="glass border-red-500/20">
                <CardContent className="p-6 text-center">
                  <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
                  <p className="font-semibold text-red-400 mb-2">Quest Expired</p>
                  <p className="text-sm text-muted-foreground">
                    This quest has expired and can no longer be completed.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
