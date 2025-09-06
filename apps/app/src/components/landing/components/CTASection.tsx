import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Rocket } from 'lucide-react';

export const CTASection = () => {
  return (
    <section className="relative py-24 px-4 overflow-hidden">
      {/* Intense animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-neon-blue/30 to-neon-purple/30 rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-neon-cyan/30 to-neon-green/30 rounded-full blur-3xl animate-float"
          style={{ animationDelay: '1s' }}
        ></div>
        <div
          className="absolute top-3/4 left-1/2 w-64 h-64 bg-gradient-to-r from-neon-pink/30 to-quest-gold/30 rounded-full blur-3xl animate-float"
          style={{ animationDelay: '2s' }}
        ></div>
      </div>

      {/* Particle effects */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-1 h-1 bg-neon-blue rounded-full animate-particle-float`}
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${8 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Pre-headline */}
        <div className="inline-flex items-center gap-2 glass px-6 py-3 rounded-full mb-8 animate-glow-pulse">
          <Rocket className="w-5 h-5 text-quest-gold" />
          <span className="text-quest-gold font-semibold">
            Your Quest Awaits
          </span>
          <Rocket className="w-5 h-5 text-quest-gold" />
        </div>

        {/* Main headline */}
        <h2 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
          <span className="block gradient-text bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent animate-gradient-shift">
            Are You Ready
          </span>
          <span className="block text-foreground">to Begin the Quest?</span>
        </h2>

        {/* Subheadline */}
        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
          Join thousands of questers earning real rewards in the most exciting
          Web3 adventure platform. Your journey to{' '}
          <span className="text-quest-gold font-semibold">
            financial freedom
          </span>{' '}
          starts now.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
          <Button
            variant="hero"
            size="xl"
            className="group animate-glow-pulse text-xl px-12 py-6"
          >
            <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            Launch App
            <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
          </Button>
        </div>

        {/* Final incentive */}
        <div className="glass p-8 rounded-2xl border-quest-gold/30 bg-gradient-to-r from-quest-gold/10 to-neon-orange/10 max-w-2xl mx-auto">
          <div className="text-quest-gold font-bold text-lg mb-2">
            🎁 Early Adopter Bonus
          </div>
          <p className="text-muted-foreground">
            First 1,000 questers get a{' '}
            <span className="text-quest-gold font-bold">
              permanent +10% reward bonus
            </span>{' '}
            and exclusive access to premium quests. Don't miss out!
          </p>
        </div>

        {/* Trust indicators */}
        <div className="mt-12 flex flex-wrap justify-center items-center gap-8 opacity-60">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></div>
            <span className="text-sm">Blockchain Secured</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-neon-blue rounded-full animate-pulse"></div>
            <span className="text-sm">Instant USDT Payouts</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-neon-purple rounded-full animate-pulse"></div>
            <span className="text-sm">Community Verified</span>
          </div>
        </div>
      </div>
    </section>
  );
};
