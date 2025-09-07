import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Trophy, Award } from 'lucide-react';
import { cn } from '../../lib/utils';

interface NavigationProps {
  className?: string;
}

export const Navigation: React.FC<NavigationProps> = ({ className }) => {
  const location = useLocation();

  const navItems = [
    {
      path: '/',
      label: 'Home',
      icon: Home,
    },
    {
      path: '/quests',
      label: 'Quests',
      icon: Trophy,
    },
    {
      path: '/leaderboard',
      label: 'Leaderboard',
      icon: Award,
    },
  ];

  return (
    <nav className={cn('flex items-center space-x-1', className)}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;

        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              'hover:bg-gradient-to-r hover:from-neon-blue/10 hover:to-neon-purple/10',
              'hover:border hover:border-neon-blue/20 hover:shadow-lg hover:shadow-neon-blue/10',
              'hover:text-neon-blue hover:scale-105',
              isActive
                ? 'bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 border border-neon-blue/30 text-neon-blue shadow-lg shadow-neon-blue/20'
                : 'text-muted-foreground border border-transparent'
            )}
          >
            <Icon className="w-4 h-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
