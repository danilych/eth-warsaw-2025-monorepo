// biome-ignore lint/correctness/noUnusedImports: <explanation>
import React from 'react';
import { Button } from '@/components/ui/button';
import { InteractiveCanvas } from './InteractiveCanvas';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <InteractiveCanvas />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background pointer-events-none" />

      <div className="relative z-10 text-center px-4 max-w-6xl mx-auto pointer-events-auto">
        {/* Floating badge */}
        <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-8 animate-float">
          <Sparkles className="w-4 h-4 text-neon-cyan" />
          <span className="text-sm text-muted-foreground">
            Next Generation Web3 Quests
          </span>
        </div>

        {/* Main headline */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
          <span className="block gradient-text bg-gradient-to-r from-neon-blue via-neon-purple to-neon-cyan bg-clip-text text-transparent animate-gradient-shift">
            Turn Quests
          </span>
          <span className="block text-foreground">Into Rewards</span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
          Complete Web3 quests, earn rewards in{' '}
          <span className="text-quest-gold font-semibold">USDT</span>, and
          unlock powerful{' '}
          <span className="text-neon-purple font-semibold">boosts</span> that
          multiply your earnings.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to="/auth">
            <Button
              variant="hero"
              size="xl"
              className="group animate-glow-pulse"
            >
              Start Your Quest
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce pointer-events-none">
        <div className="w-6 h-10 border-2 border-neon-blue/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-neon-blue rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  );
};
