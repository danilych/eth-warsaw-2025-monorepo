// biome-ignore lint/style/useImportType: <explanation>
import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Trophy } from 'lucide-react';
import { LoginButton } from '../components/ui/AuthButtons';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export const AuthPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  if (user && !isLoading) {
    navigate('/quests');
    return;
  }

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
