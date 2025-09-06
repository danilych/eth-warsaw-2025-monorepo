// biome-ignore lint/correctness/noUnusedImports: <explanation>
import React from 'react';
import { Button } from './button';
import { LogIn } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface LoginButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'hero';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function LoginButton({
  variant = 'default',
  size = 'default',
  className,
}: LoginButtonProps) {
  const { signIn, isLoading } = useAuth();

  const handleLogin = async () => {
    await signIn();
  };

  return (
    <Button
      onClick={handleLogin}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={className}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Connecting...
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <LogIn className="w-4 h-4" />
          Connect Wallet
        </div>
      )}
    </Button>
  );
}
