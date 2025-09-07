// biome-ignore lint/style/useImportType: <explanation>
import React, { useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Trophy } from 'lucide-react';
import { LoginButton } from '../components/ui/AuthButtons';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@civic/auth-web3/react';

export const AuthPage: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useUser();
  const navigate = useNavigate();

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (user && isAuthenticated && !isLoading) {
      navigate('/quests');
      return;
    }
  }, [user, isAuthenticated]);

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
};
