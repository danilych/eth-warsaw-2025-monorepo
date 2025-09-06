import { Target, Zap, TrendingUp, Users } from 'lucide-react';

export const HowItWorksSection = () => {
  const steps = [
    {
      icon: Target,
      title: "Choose Your Quest",
      description: "Browse available quests from Web3 protocols, DeFi platforms, and blockchain games.",
      color: "neon-blue",
      delay: "0s"
    },
    {
      icon: Zap,
      title: "Activate Boost Mode",
      description: "Once a day, a random quest gets +20% reward boost. Time it right for maximum earnings!",
      color: "neon-purple",
      delay: "0.2s"
    },
    {
      icon: TrendingUp,
      title: "Build Combo Series",
      description: "Complete consecutive quests to unlock multipliers. Each combo increases rewards by ×1.2!",
      color: "neon-cyan",
      delay: "0.4s"
    },
    {
      icon: Users,
      title: "Earn Together",
      description: "Invite friends or join groups to unlock social bonuses and amplify your rewards.",
      color: "neon-green",
      delay: "0.6s"
    }
  ];

  return (
    <section className="relative py-24 px-4 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-neon-blue/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-neon-purple/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            How It <span className="gradient-text bg-gradient-to-r from-neon-purple to-neon-cyan bg-clip-text text-transparent">Works</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A gamified quest system that rewards strategy, timing, and collaboration
          </p>
        </div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div 
                key={index}
                className="quest-chain group relative"
                style={{ animationDelay: step.delay }}
              >
                <div className="glass p-8 rounded-2xl text-center hover:border-neon-blue/50 transition-all duration-500 group-hover:transform group-hover:scale-105 animate-slide-up">
                  {/* Icon */}
                  <div className={`inline-flex p-4 rounded-2xl bg-${step.color}/20 border border-${step.color}/30 mb-6 group-hover:bg-${step.color}/30 transition-colors`}>
                    <Icon className={`w-8 h-8 text-${step.color}`} />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-bold mb-4">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                  
                  {/* Step number */}
                  <div className={`absolute -top-3 -right-3 w-8 h-8 rounded-full bg-${step.color} text-background text-sm font-bold flex items-center justify-center`}>
                    {index + 1}
                  </div>
                </div>
                
                {/* Connecting line (hidden on last item) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 left-full w-8 h-0.5 bg-gradient-to-r from-neon-blue to-neon-purple opacity-50 transform -translate-y-1/2 animate-pulse-line"></div>
                )}
              </div>
            );
          })}
        </div>

        {/* Boost highlight */}
        <div className="mt-16 glass p-8 rounded-2xl text-center border-quest-gold/30 bg-quest-gold/5">
          <div className="inline-flex items-center gap-2 mb-4">
            <Zap className="w-6 h-6 text-quest-gold animate-pulse" />
            <span className="text-quest-gold font-bold text-lg">Daily Boost Mode</span>
            <Zap className="w-6 h-6 text-quest-gold animate-pulse" />
          </div>
          <p className="text-muted-foreground text-lg">
            Every 24 hours, one random quest receives a <span className="text-quest-gold font-bold">+20% reward boost</span>. 
            Stay active to catch the boost and maximize your earnings!
          </p>
        </div>
      </div>
    </section>
  );
};