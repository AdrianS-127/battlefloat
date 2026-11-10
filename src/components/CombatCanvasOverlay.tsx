import React, { useEffect, useRef } from 'react';

export interface CombatAnimationEvent {
  id: string;
  type: 'hit' | 'miss' | 'sonar';
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  progress: number; // 0 to 1
  phase: 'flight' | 'impact' | 'done';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  life: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

interface Props {
  activeEvents: CombatAnimationEvent[];
  onEventFinished: (id: string) => void;
  triggerScreenShake?: () => void;
}

export const CombatCanvasOverlay: React.FC<Props> = ({
  activeEvents,
  onEventFinished,
  triggerScreenShake,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const eventsStateRef = useRef<Map<string, { progress: number; triggeredImpact: boolean }>>(new Map());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Render & update active flight/impact events
      for (const ev of activeEvents) {
        let state = eventsStateRef.current.get(ev.id);
        if (!state) {
          state = { progress: 0, triggeredImpact: false };
          eventsStateRef.current.set(ev.id, state);
        }

        // Flight speed (travels in ~0.35s)
        state.progress += dt * 2.8;

        if (state.progress < 1) {
          // Missile flight arc
          const t = state.progress;
          // Quadratic bezier arc
          const midX = (ev.startX + ev.targetX) / 2;
          const midY = Math.min(ev.startY, ev.targetY) - 120; // Arc height

          const curX = (1 - t) * (1 - t) * ev.startX + 2 * (1 - t) * t * midX + t * t * ev.targetX;
          const curY = (1 - t) * (1 - t) * ev.startY + 2 * (1 - t) * t * midY + t * t * ev.targetY;

          // Draw missile rocket flame
          ctx.beginPath();
          ctx.arc(curX, curY, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = '#fef08a';
          ctx.shadowColor = '#f97316';
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;

          // Spawn smoke trail particles
          if (Math.random() < 0.7) {
            particlesRef.current.push({
              x: curX + (Math.random() - 0.5) * 4,
              y: curY + (Math.random() - 0.5) * 4,
              vx: (Math.random() - 0.5) * 20,
              vy: Math.random() * 20 + 5,
              size: Math.random() * 3 + 2,
              color: Math.random() < 0.5 ? '#94a3b8' : '#fb923c',
              alpha: 0.8,
              decay: 1.5,
              life: 1,
            });
          }
        } else if (!state.triggeredImpact) {
          state.triggeredImpact = true;
          // Trigger explosion or splash particles
          if (ev.type === 'hit') {
            if (triggerScreenShake) triggerScreenShake();
            // Explosion fireball burst
            for (let i = 0; i < 40; i++) {
              const angle = Math.random() * Math.PI * 2;
              const speed = Math.random() * 180 + 40;
              particlesRef.current.push({
                x: ev.targetX,
                y: ev.targetY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 5 + 3,
                color: i % 3 === 0 ? '#ef4444' : i % 3 === 1 ? '#f97316' : '#fef08a',
                alpha: 1,
                decay: 1.8,
                life: 1,
              });
            }
            // Fiery shockwave ripple
            ripplesRef.current.push({
              x: ev.targetX,
              y: ev.targetY,
              radius: 4,
              maxRadius: 45,
              alpha: 0.9,
              color: 'rgba(239, 68, 68, ',
            });
          } else if (ev.type === 'miss') {
            // Water droplets splash
            for (let i = 0; i < 28; i++) {
              const angle = Math.PI + (Math.random() - 0.5) * Math.PI * 1.4; // upward spray
              const speed = Math.random() * 140 + 30;
              particlesRef.current.push({
                x: ev.targetX,
                y: ev.targetY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 3 + 1.5,
                color: '#38bdf8',
                alpha: 0.9,
                decay: 1.6,
                life: 1,
              });
            }
            // Water ripples
            ripplesRef.current.push({
              x: ev.targetX,
              y: ev.targetY,
              radius: 5,
              maxRadius: 36,
              alpha: 0.8,
              color: 'rgba(56, 189, 248, ',
            });
          } else if (ev.type === 'sonar') {
            // Expanding sonar rings
            ripplesRef.current.push({
              x: ev.targetX,
              y: ev.targetY,
              radius: 5,
              maxRadius: 85,
              alpha: 0.85,
              color: 'rgba(34, 197, 94, ',
            });
          }

          // Finish event after impact effect plays
          setTimeout(() => {
            onEventFinished(ev.id);
            eventsStateRef.current.delete(ev.id);
          }, 450);
        }
      }

      // Update & Draw particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= p.decay * dt;

        if (p.life <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha * p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Update & Draw ripples
      for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
        const r = ripplesRef.current[i];
        r.radius += 80 * dt;
        r.alpha -= 1.6 * dt;

        if (r.alpha <= 0 || r.radius >= r.maxRadius) {
          ripplesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `${r.color}${Math.max(0, r.alpha)})`;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, [activeEvents, onEventFinished, triggerScreenShake]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-30"
      style={{ width: '100%', height: '100%' }}
    />
  );
};
