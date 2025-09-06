import { TrendingUp, Clock, DollarSign, Award } from 'lucide-react';

export const RewardsSection = () => {
  return (
    <section className="relative py-24 px-4 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-gradient-to-r from-neon-cyan/20 to-neon-green/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-gradient-to-r from-neon-purple/20 to-neon-pink/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }}></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Dynamic <span className="gradient-text bg-gradient-to-r from-quest-gold to-neon-pink bg-clip-text text-transparent">Rewards</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our advanced reward system adapts to timing, participation, and community dynamics
          </p>
        </div>

        {/* Reward mechanics grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Time-based rewards */}
          <div className="glass p-8 rounded-2xl border-neon-cyan/30">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-xl bg-neon-cyan/20 border border-neon-cyan/30">
                <Clock className="w-6 h-6 text-neon-cyan" />
              </div>
              <h3 className="text-2xl font-bold">Time-Based Scaling</h3>
            </div>
            <p className="text-muted-foreground mb-6">
              Early birds get bonus rewards! Rewards follow a dynamic curve based on completion time and total participants.
            </p>
            
            {/* Visual representation */}
            <div className="relative h-32 glass rounded-lg p-4 border-neon-cyan/20">
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                <div className="w-8 h-16 bg-gradient-to-t from-neon-cyan to-neon-cyan/50 rounded-t animate-pulse"></div>
                <div className="w-8 h-12 bg-gradient-to-t from-neon-cyan to-neon-cyan/50 rounded-t animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                <div className="w-8 h-8 bg-gradient-to-t from-neon-cyan to-neon-cyan/50 rounded-t animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="w-8 h-6 bg-gradient-to-t from-neon-cyan to-neon-cyan/50 rounded-t animate-pulse" style={{ animationDelay: '1.5s' }}></div>
              </div>
              <div className="absolute top-2 left-4 text-xs text-neon-cyan">Reward Amount</div>
              <div className="absolute bottom-1 right-4 text-xs text-muted-foreground">Time →</div>
            </div>
          </div>

          {/* Growth mechanics */}
          <div className="glass p-8 rounded-2xl border-neon-green/30">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-xl bg-neon-green/20 border border-neon-green/30">
                <TrendingUp className="w-6 h-6 text-neon-green" />
              </div>
              <h3 className="text-2xl font-bold">Growth Curves</h3>
            </div>
            <p className="text-muted-foreground mb-6">
              Rewards scale using mathematical functions (sqrt, logarithmic) to balance fairness and growth potential.
            </p>
            
            {/* Curve visualization */}
            <div className="relative h-32 glass rounded-lg p-4 border-neon-green/20">
              <svg className="w-full h-full" viewBox="0 0 200 100">
                <path
                  d="M 10 90 Q 50 60 100 40 T 190 20"
                  stroke="hsl(var(--neon-green))"
                  strokeWidth="2"
                  fill="none"
                  className="animate-pulse"
                />
                <circle cx="10" cy="90" r="3" fill="hsl(var(--neon-green))" className="animate-pulse" />
                <circle cx="100" cy="40" r="3" fill="hsl(var(--neon-green))" className="animate-pulse" style={{ animationDelay: '1s' }} />
                <circle cx="190" cy="20" r="3" fill="hsl(var(--neon-green))" className="animate-pulse" style={{ animationDelay: '2s' }} />
              </svg>
              <div className="absolute top-2 left-4 text-xs text-neon-green">Growth</div>
              <div className="absolute bottom-1 right-4 text-xs text-muted-foreground">Participation →</div>
            </div>
          </div>
        </div>

        {/* Reward features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="inline-flex p-4 rounded-2xl bg-quest-gold/20 border border-quest-gold/30 mb-4">
              <DollarSign className="w-8 h-8 text-quest-gold" />
            </div>
            <h3 className="text-xl font-bold mb-2">USDT Payments</h3>
            <p className="text-muted-foreground">All rewards paid in stable USDT tokens for consistent value</p>
          </div>

          <div className="text-center">
            <div className="inline-flex p-4 rounded-2xl bg-neon-purple/20 border border-neon-purple/30 mb-4">
              <Award className="w-8 h-8 text-neon-purple" />
            </div>
            <h3 className="text-xl font-bold mb-2">Combo Multipliers</h3>
            <p className="text-muted-foreground">Stack consecutive quest completions for up to ×1.2 bonus</p>
          </div>

          <div className="text-center">
            <div className="inline-flex p-4 rounded-2xl bg-neon-pink/20 border border-neon-pink/30 mb-4">
              <TrendingUp className="w-8 h-8 text-neon-pink" />
            </div>
            <h3 className="text-xl font-bold mb-2">Dynamic Scaling</h3>
            <p className="text-muted-foreground">Rewards adapt based on completion order and timing</p>
          </div>
        </div>

        {/* Highlight box */}
        <div className="mt-16 relative">
          <div className="glass p-8 rounded-2xl text-center border-neon-blue/30 bg-gradient-to-r from-neon-blue/5 to-neon-purple/5">
            <h3 className="text-2xl font-bold mb-4">
              Smart Reward Distribution
            </h3>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Our algorithm considers <span className="text-neon-blue font-semibold">completion timing</span>, 
              {' '}<span className="text-neon-purple font-semibold">total participants</span>, 
              {' '}<span className="text-neon-cyan font-semibold">social engagement</span>, and 
              {' '}<span className="text-neon-green font-semibold">quest difficulty</span> to ensure fair and exciting rewards for everyone.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};