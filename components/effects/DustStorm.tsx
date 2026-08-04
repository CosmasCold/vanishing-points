// components/effects/DustStorm.tsx
'use client';

import React, { useEffect, useRef } from 'react';

interface DustStormProps {
  dustLevel: number;
  corruptionStage: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
}

export function DustStorm({ dustLevel, corruptionStage }: DustStormProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  const isActive = dustLevel > 20;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const maxParticles = Math.min(
      Math.floor(((dustLevel - 20) / 80) * 200),
      120
    );

    // Initialize particles
    while (particlesRef.current.length < maxParticles) {
      particlesRef.current.push(createParticle(canvas.width, canvas.height));
    }
    while (particlesRef.current.length > maxParticles) {
      particlesRef.current.pop();
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      const count = Math.min(particles.length, maxParticles);

      for (let i = 0; i < count; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        // Wrap around
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.y > canvas.height + 10) p.y = -10;

        // Respawn if aged out
        if (p.life > p.maxLife) {
          particles[i] = createParticle(canvas.width, canvas.height);
          continue;
        }

        const fade = 1 - p.life / p.maxLife;
        const alpha = p.opacity * fade * (0.1 + corruptionStage * 0.05);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(196, 120, 90, ${alpha})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [dustLevel, corruptionStage]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-25"
      style={{ opacity: 1 }}
    />
  );
}

function createParticle(w: number, h: number): Particle {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.2 - 0.05, // slight upward drift
    size: 0.5 + Math.random() * 2,
    opacity: 0.1 + Math.random() * 0.2,
    life: 0,
    maxLife: 300 + Math.random() * 600,
  };
}