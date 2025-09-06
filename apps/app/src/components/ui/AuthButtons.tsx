import React from 'react';
import { Button } from './button';
import { LogIn, LogOut, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface LoginButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'hero';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function LoginButton({ variant = 'default', size = 'default', className }: LoginButtonProps) {
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

export function UserProfileButton() {
  const { user, signOut } = useAuth();

  if (!user) return null;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
        <User className="w-4 h-4" />
        <span className="text-sm font-medium">
          {user.id?.slice(0, 6)}...{user.id?.slice(-4)}
        </span>
      </div>
      <Button onClick={signOut} variant="ghost" size="sm">
        <LogOut className="w-4 h-4" />
      </Button>
    </div>
  );
}
