import { Users, UserPlus, Zap, Heart } from 'lucide-react';

export const SocialBonusSection = () => {
  return (
    <section className="relative py-24 px-4 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-neon-pink/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-neon-green/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="gradient-text bg-gradient-to-r from-neon-pink to-neon-green bg-clip-text text-transparent">Social</span> Bonuses
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Quest together, earn together. Unlock powerful multipliers through community engagement
          </p>
        </div>

        {/* Main visual - Avatar connections */}
        <div className="mb-16 relative">
          <div className="flex justify-center items-center space-x-8 md:space-x-16">
            {/* Central hub */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-neon-pink to-neon-purple glass border-2 border-neon-pink/50 flex items-center justify-center animate-glow-pulse">
                <Users className="w-8 h-8 text-white" />
              </div>
              
              {/* Connected avatars */}
              {[0, 1, 2, 3, 4].map((index) => {
                const angle = (index * 360) / 5;
                const x = Math.cos((angle * Math.PI) / 180) * 120;
                const y = Math.sin((angle * Math.PI) / 180) * 120;
                
                return (
                  <div key={index}>
                    {/* Connection line */}
                    <div 
                      className="absolute w-24 h-0.5 bg-gradient-to-r from-neon-pink/60 to-transparent animate-pulse"
                      style={{
                        transform: `rotate(${angle}deg)`,
                        transformOrigin: '0 50%',
                        left: '50%',
                        top: '50%',
                        animationDelay: `${index * 0.2}s`
                      }}
                    />
                    
                    {/* Avatar */}
                    <div 
                      className="absolute w-12 h-12 rounded-full glass border-2 border-neon-green/50 flex items-center justify-center animate-float"
                      style={{
                        left: `calc(50% + ${x}px - 24px)`,
                        top: `calc(50% + ${y}px - 24px)`,
                        animationDelay: `${index * 0.3}s`
                      }}
                    >
                      <div className="w-6 h-6 bg-gradient-to-r from-neon-green to-neon-cyan rounded-full"></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Social features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Friend invites */}
          <div className="glass p-8 rounded-2xl border-neon-pink/30 group hover:border-neon-pink/50 transition-colors">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-xl bg-neon-pink/20 border border-neon-pink/30">
                <UserPlus className="w-6 h-6 text-neon-pink" />
              </div>
              <h3 className="text-2xl font-bold">Invite Friends</h3>
            </div>
            <p className="text-muted-foreground mb-6">
              Earn permanent bonus rewards for every friend you invite. Both you and your friend get boosted rewards!
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-neon-pink/10 border border-neon-pink/20">
                <span className="text-sm">1st Friend</span>
                <span className="text-neon-pink font-bold">+5% Forever</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-neon-pink/10 border border-neon-pink/20">
                <span className="text-sm">5 Friends</span>
                <span className="text-neon-pink font-bold">+15% Forever</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-neon-pink/10 border border-neon-pink/20">
                <span className="text-sm">10+ Friends</span>
                <span className="text-neon-pink font-bold">+25% Forever</span>
              </div>
            </div>
          </div>

          {/* Group quests */}
          <div className="glass p-8 rounded-2xl border-neon-green/30 group hover:border-neon-green/50 transition-colors">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-xl bg-neon-green/20 border border-neon-green/30">
                <Heart className="w-6 h-6 text-neon-green" />
              </div>
              <h3 className="text-2xl font-bold">Group Quests</h3>
            </div>
            <p className="text-muted-foreground mb-6">
              Join forces with other questers to tackle group challenges and unlock exclusive multipliers.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-neon-green/10 border border-neon-green/20">
                <span className="text-sm">2-3 Members</span>
                <span className="text-neon-green font-bold">×1.1 Multiplier</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-neon-green/10 border border-neon-green/20">
                <span className="text-sm">4-5 Members</span>
                <span className="text-neon-green font-bold">×1.2 Multiplier</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-neon-green/10 border border-neon-green/20">
                <span className="text-sm">6+ Members</span>
                <span className="text-neon-green font-bold">×1.3 Multiplier</span>
              </div>
            </div>
          </div>
        </div>

        {/* Community features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 glass rounded-xl hover:border-neon-blue/50 transition-colors">
            <div className="inline-flex p-3 rounded-xl bg-neon-blue/20 border border-neon-blue/30 mb-4">
              <Zap className="w-6 h-6 text-neon-blue" />
            </div>
            <h3 className="text-lg font-bold mb-2">Team Boosts</h3>
            <p className="text-muted-foreground text-sm">Share daily boosts with your team members</p>
          </div>

          <div className="text-center p-6 glass rounded-xl hover:border-neon-purple/50 transition-colors">
            <div className="inline-flex p-3 rounded-xl bg-neon-purple/20 border border-neon-purple/30 mb-4">
              <Users className="w-6 h-6 text-neon-purple" />
            </div>
            <h3 className="text-lg font-bold mb-2">Guild System</h3>
            <p className="text-muted-foreground text-sm">Join guilds for exclusive quests and rewards</p>
          </div>

          <div className="text-center p-6 glass rounded-xl hover:border-neon-cyan/50 transition-colors">
            <div className="inline-flex p-3 rounded-xl bg-neon-cyan/20 border border-neon-cyan/30 mb-4">
              <Heart className="w-6 h-6 text-neon-cyan" />
            </div>
            <h3 className="text-lg font-bold mb-2">Community Events</h3>
            <p className="text-muted-foreground text-sm">Participate in special community-wide challenges</p>
          </div>
        </div>

        {/* Call to action */}
        <div className="mt-16 text-center">
          <div className="glass p-8 rounded-2xl border-gradient-to-r from-neon-pink/30 to-neon-green/30 bg-gradient-to-r from-neon-pink/5 to-neon-green/5">
            <h3 className="text-2xl font-bold mb-4">
              The Power of <span className="text-neon-pink">Community</span>
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              In Web3, we're stronger together. Build your network, support your friends, 
              and watch your rewards multiply through the power of community collaboration.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};