import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Wallet, Sparkles, Shield, Zap } from 'lucide-react';
import { useUser } from '@civic/auth-web3/react';
import { AuthService } from '../../services/auth.service';

interface WalletSetupProps {
  onWalletCreated: (address: string) => void;
}

export function WalletSetup({ onWalletCreated }: WalletSetupProps) {
  const userContext = useUser();
  const [error, setError] = useState<string | null>(null);
  const processedWalletRef = useRef<string | null>(null);

  // Get wallet creation progress from Civic Auth
  const isWalletCreationInProgress = 'walletCreationInProgress' in userContext ? 
    userContext.walletCreationInProgress : false;

  // Extract specific values to avoid userContext dependency issues
  const user = userContext.user;
  const ethereum = 'ethereum' in userContext ? userContext.ethereum : null;
  const walletAddress = ethereum ? (ethereum as { address: string }).address : null;

  const processWallet = useCallback(async (userId: string, address: string) => {
    if (processedWalletRef.current === address) return; // Already processed this wallet
    
    processedWalletRef.current = address;
    try {
      await AuthService.createUser(userId, address);
      onWalletCreated(address);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
      processedWalletRef.current = null; // Reset on error to allow retry
    }
  }, [onWalletCreated]);

  // Check if user already has a wallet on component mount and handle wallet creation completion
  useEffect(() => {
    if (!user || !walletAddress) return;
    processWallet(user.id, walletAddress);
  }, [user, walletAddress, processWallet]);

  const handleCreateWallet = async () => {
    try {
      setError(null);

      if (!userContext.user) {
        throw new Error('User not authenticated');
      }

      // Create new embedded wallet using Civic Auth
      if ('createWallet' in userContext && typeof userContext.createWallet === 'function') {
        await userContext.createWallet();
        // The wallet creation progress will be tracked by the useEffect above
        // No need for setTimeout - walletCreationInProgress will handle the state
      } else {
        throw new Error('createWallet function not available');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create wallet');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-background/80">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--neon-blue)/0.1_0%,_transparent_70%)]" />
      
      <Card className="w-full max-w-md glass border-neon-blue/20 relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-r from-neon-blue to-neon-purple flex items-center justify-center">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          
          <div>
            <CardTitle className="text-2xl font-bold gradient-text bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">
              Create Your Wallet
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              Set up your embedded wallet to start earning rewards from quests
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-neon-blue/5 border border-neon-blue/20">
              <Shield className="w-5 h-5 text-neon-blue" />
              <div>
                <p className="font-medium text-sm">Secure & Private</p>
                <p className="text-xs text-muted-foreground">Your wallet is encrypted and stored securely</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-neon-purple/5 border border-neon-purple/20">
              <Zap className="w-5 h-5 text-neon-purple" />
              <div>
                <p className="font-medium text-sm">Instant Access</p>
                <p className="text-xs text-muted-foreground">Start claiming quest rewards immediately</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-neon-cyan/5 border border-neon-cyan/20">
              <Sparkles className="w-5 h-5 text-neon-cyan" />
              <div>
                <p className="font-medium text-sm">Web3 Ready</p>
                <p className="text-xs text-muted-foreground">Compatible with all quest types and rewards</p>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Create Wallet Button */}
          <Button
            onClick={handleCreateWallet}
            disabled={isWalletCreationInProgress}
            className="w-full bg-gradient-to-r from-neon-blue to-neon-purple hover:from-neon-blue/80 hover:to-neon-purple/80 text-white font-semibold py-3 rounded-lg transition-all duration-300 glow-primary"
            size="lg"
          >
            {isWalletCreationInProgress ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating Wallet...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Create Embedded Wallet
              </div>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            By creating a wallet, you agree to our terms of service and privacy policy
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
