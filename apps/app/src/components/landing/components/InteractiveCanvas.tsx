import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  life: number;
  maxLife: number;
  trail: { x: number; y: number; opacity: number }[];
}

interface WaveRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  color: string;
}

export const InteractiveCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const ripplesRef = useRef<WaveRipple[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, isActive: false });
  const animationRef = useRef<number>();
  const mouseTrailRef = useRef<{ x: number; y: number; opacity: number }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles
    const initParticles = () => {
      particlesRef.current = [];
      const particleCount = Math.min(150, Math.floor((canvas.width * canvas.height) / 12000));
      
      for (let i = 0; i < particleCount; i++) {
        const maxLife = 300 + Math.random() * 200;
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          size: Math.random() * 3 + 1,
          opacity: Math.random() * 0.6 + 0.2,
          color: ['#4F9CFF', '#8B5CF6', '#00E6FF', '#00D9FF', '#FF6B9D', '#FFD700'][Math.floor(Math.random() * 6)],
          life: maxLife,
          maxLife: maxLife,
          trail: []
        });
      }
    };

    // Create ripple effect
    const createRipple = (x: number, y: number, color: string = '#4F9CFF') => {
      ripplesRef.current.push({
        x,
        y,
        radius: 0,
        maxRadius: 150 + Math.random() * 100,
        opacity: 0.8,
        color
      });
    };

    // Spawn particles at mouse position
    const spawnParticles = (x: number, y: number, count: number = 3) => {
      const colors = ['#4F9CFF', '#8B5CF6', '#00E6FF', '#00D9FF', '#FF6B9D', '#FFD700'];
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const speed = 2 + Math.random() * 3;
        const maxLife = 150 + Math.random() * 100;
        
        particlesRef.current.push({
          x: x + (Math.random() - 0.5) * 20,
          y: y + (Math.random() - 0.5) * 20,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 4 + 2,
          opacity: 0.9,
          color: colors[Math.floor(Math.random() * colors.length)],
          life: maxLife,
          maxLife: maxLife,
          trail: []
        });
      }
    };

    initParticles();

    // Mouse handlers
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const newX = e.clientX - rect.left;
      const newY = e.clientY - rect.top;
      
      // Add to mouse trail
      mouseTrailRef.current.push({ x: newX, y: newY, opacity: 1 });
      if (mouseTrailRef.current.length > 20) {
        mouseTrailRef.current.shift();
      }
      
      // Create ripples on significant mouse movement
      const dx = newX - mouseRef.current.x;
      const dy = newY - mouseRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 50 && mouseRef.current.isActive) {
        createRipple(newX, newY, '#00E6FF');
        spawnParticles(newX, newY, 2);
      }
      
      mouseRef.current.x = newX;
      mouseRef.current.y = newY;
    };

    const handleMouseEnter = () => {
      mouseRef.current.isActive = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.isActive = false;
      mouseTrailRef.current = [];
    };

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      createRipple(x, y, '#FF6B9D');
      spawnParticles(x, y, 8);
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseenter', handleMouseEnter);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('click', handleClick);

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw mouse trail
      mouseTrailRef.current.forEach((point, index) => {
        point.opacity -= 0.05;
        if (point.opacity <= 0) return;
        
        const size = (point.opacity * 15) * (1 - index / mouseTrailRef.current.length);
        const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, size);
        gradient.addColorStop(0, `rgba(0, 230, 255, ${point.opacity * 0.3})`);
        gradient.addColorStop(1, `rgba(0, 230, 255, 0)`);
        
        ctx.beginPath();
        ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });
      
      // Clean up old trail points
      mouseTrailRef.current = mouseTrailRef.current.filter(point => point.opacity > 0);
      
      // Update and draw ripples
      ripplesRef.current.forEach((ripple, index) => {
        ripple.radius += 3;
        ripple.opacity -= 0.015;
        
        if (ripple.opacity <= 0 || ripple.radius >= ripple.maxRadius) {
          ripplesRef.current.splice(index, 1);
          return;
        }
        
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `${ripple.color}${Math.floor(ripple.opacity * 255).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Inner glow
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius - 1, 0, Math.PI * 2);
        ctx.strokeStyle = `${ripple.color}${Math.floor(ripple.opacity * 0.3 * 255).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = 4;
        ctx.stroke();
      });
      
      // Update and draw particles
      particlesRef.current.forEach((particle, index) => {
        // Age particle
        particle.life--;
        if (particle.life <= 0) {
          particlesRef.current.splice(index, 1);
          return;
        }
        
        // Update trail
        particle.trail.push({ x: particle.x, y: particle.y, opacity: particle.opacity });
        if (particle.trail.length > 8) {
          particle.trail.shift();
        }
        
        // Mouse magnetic effect
        const dx = mouseRef.current.x - particle.x;
        const dy = mouseRef.current.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (mouseRef.current.isActive && distance < 200) {
          const force = (200 - distance) / 200;
          const attraction = force * 0.0008;
          particle.vx += dx * attraction;
          particle.vy += dy * attraction;
          particle.opacity = Math.min(1, particle.opacity + force * 0.02);
          
          // Color shift based on proximity
          if (distance < 80) {
            particle.color = '#FFD700'; // Gold when very close
          } else if (distance < 120) {
            particle.color = '#FF6B9D'; // Pink when close
          }
        } else {
          particle.opacity = Math.max(0.1, particle.opacity - 0.005);
        }
        
        // Apply velocity
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Add slight gravity and friction
        particle.vy += 0.01;
        particle.vx *= 0.999;
        particle.vy *= 0.999;
        
        // Boundary handling with bounce
        if (particle.x < 0 || particle.x > canvas.width) {
          particle.vx *= -0.8;
          particle.x = Math.max(0, Math.min(canvas.width, particle.x));
        }
        if (particle.y < 0 || particle.y > canvas.height) {
          particle.vy *= -0.8;
          particle.y = Math.max(0, Math.min(canvas.height, particle.y));
        }
        
        // Draw particle trail
        particle.trail.forEach((trailPoint, trailIndex) => {
          const trailOpacity = (trailIndex / particle.trail.length) * particle.opacity * 0.3;
          const trailSize = particle.size * (trailIndex / particle.trail.length) * 0.5;
          
          ctx.beginPath();
          ctx.arc(trailPoint.x, trailPoint.y, trailSize, 0, Math.PI * 2);
          ctx.fillStyle = particle.color + Math.floor(trailOpacity * 255).toString(16).padStart(2, '0');
          ctx.fill();
        });
        
        // Draw main particle with glow
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size * 2
        );
        gradient.addColorStop(0, particle.color + Math.floor(particle.opacity * 255).toString(16).padStart(2, '0'));
        gradient.addColorStop(0.7, particle.color + Math.floor(particle.opacity * 0.3 * 255).toString(16).padStart(2, '0'));
        gradient.addColorStop(1, particle.color + '00');
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Core particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color + Math.floor(particle.opacity * 255).toString(16).padStart(2, '0');
        ctx.fill();
        
        // Draw enhanced connections
        particlesRef.current.slice(index + 1).forEach(otherParticle => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 120) {
            const connectionOpacity = 0.2 * (1 - distance / 120);
            const gradient = ctx.createLinearGradient(
              particle.x, particle.y,
              otherParticle.x, otherParticle.y
            );
            gradient.addColorStop(0, particle.color + Math.floor(connectionOpacity * 255).toString(16).padStart(2, '0'));
            gradient.addColorStop(1, otherParticle.color + Math.floor(connectionOpacity * 255).toString(16).padStart(2, '0'));
            
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      });
      
      // Spawn new particles occasionally
      if (Math.random() < 0.02 && particlesRef.current.length < 150) {
        const maxLife = 400 + Math.random() * 200;
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 1,
          vy: (Math.random() - 0.5) * 1,
          size: Math.random() * 2 + 1,
          opacity: Math.random() * 0.5 + 0.1,
          color: ['#4F9CFF', '#8B5CF6', '#00E6FF', '#00D9FF', '#FF6B9D', '#FFD700'][Math.floor(Math.random() * 6)],
          life: maxLife,
          maxLife: maxLife,
          trail: []
        });
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseenter', handleMouseEnter);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('click', handleClick);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef}
      className="quest-canvas"
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'auto',
        zIndex: 0,
        cursor: 'crosshair'
      }}
    />
  );
};