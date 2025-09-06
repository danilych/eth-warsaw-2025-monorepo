import React from 'react';
import { HeroSection } from '@/components/landing/components/HeroSection';
import { HowItWorksSection } from '@/components/landing/components/HowItWorksSection';
import { RewardsSection } from '@/components/landing/components/RewardsSection';
import { SocialBonusSection } from '@/components/landing/components/SocialBonusSection';
import { CTASection } from '@/components/landing/components/CTASection';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <HowItWorksSection />
      <RewardsSection />
      <SocialBonusSection />
      <CTASection />
    </div>
  );
};

export default Index;
