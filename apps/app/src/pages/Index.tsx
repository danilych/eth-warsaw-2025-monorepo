// biome-ignore lint/correctness/noUnusedImports: <explanation>
import React from 'react';
import { Navigation } from '../components/navigation/Navigation';
import { useUser } from '@civic/auth-web3/react';
import { HeroSection } from '../components/landing/components/HeroSection';
import { HowItWorksSection } from '../components/landing/components/HowItWorksSection';
import { RewardsSection } from '../components/landing/components/RewardsSection';
import { SocialBonusSection } from '../components/landing/components/SocialBonusSection';
import { CTASection } from '../components/landing/components/CTASection';

const Index = () => {
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      {user && (
        <div className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4 flex justify-center">
            <Navigation />
          </div>
        </div>
      )}
      
      <HeroSection />
      <HowItWorksSection />
      <RewardsSection />
      <SocialBonusSection />
      <CTASection />
    </div>
  );
};

export default Index;
