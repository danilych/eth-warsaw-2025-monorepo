import React from 'react';
import { UserButton } from '@civic/auth-web3/react';
import { Button } from '@/components/ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { LogIn, User } from 'lucide-react';

interface LoginButtonProps {
  className?: string;
  variant?: 'default' | 'hero' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'xl';
}

export function LoginButton({ className, variant = 'default', size = 'default' }: LoginButtonProps) {
  const { user, signIn, isLoading } = useAuth();

  if (user) {
    return (
      <UserButton 
        className={className}
        style={{
          background: 'linear-gradient(135deg, hsl(var(--neon-blue)), hsl(var(--neon-purple)))',
          border: '1px solid hsl(var(--neon-blue) / 0.3)',
          borderRadius: '0.75rem',
          color: 'white',
          fontWeight: '600',
          padding: '0.75rem 1.5rem',
          minWidth: '120px',
          backdropFilter: 'blur(20px)',
        }}
        dropdownButtonStyle={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          color: 'hsl(var(--foreground))',
        }}
      />
    );
  }

  return (
    <Button
      onClick={signIn}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={`${className} group`}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Connecting...
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <LogIn className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          Connect Wallet
        </div>
      )}
    </Button>
  );
}

export function UserProfileButton() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="flex items-center gap-3 glass p-3 rounded-lg border border-neon-blue/20">
      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-neon-blue to-neon-purple flex items-center justify-center">
        {user.picture ? (
          <img 
            src={user.picture} 
            alt={user.name || 'User'} 
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <User className="w-4 h-4 text-white" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">
          {user.name || user.email || 'Anonymous User'}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {user.email || 'No email'}
        </p>
      </div>
    </div>
  );
}
