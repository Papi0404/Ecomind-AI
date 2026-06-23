'use client';

/**
 * src/components/AiAmbientBackground.tsx
 * ────────────────────────────────────────
 * Reacts to AI state:  idle → soft float | processing → faster, brighter | done → pulse then settle
 * Uses pure CSS animations — no canvas — so it is SSR-safe and lightweight.
 */

import { useEffect, useState } from 'react';

type AiState = 'idle' | 'processing' | 'done';

interface Props {
  aiState?: AiState;
}

const PARTICLES = [
  // [x%, y%, size, delayS, durationS, shape]
  { x: 8,   y: 12,  size: 6,   delay: 0,   dur: 9,  shape: 'hex'    },
  { x: 88,  y: 8,   size: 8,   delay: 1.2, dur: 11, shape: 'circle' },
  { x: 20,  y: 78,  size: 5,   delay: 2.5, dur: 7,  shape: 'tri'    },
  { x: 72,  y: 55,  size: 10,  delay: 0.8, dur: 13, shape: 'hex'    },
  { x: 45,  y: 20,  size: 4,   delay: 3.0, dur: 8,  shape: 'circle' },
  { x: 60,  y: 88,  size: 7,   delay: 1.5, dur: 10, shape: 'hex'    },
  { x: 33,  y: 45,  size: 5,   delay: 4.0, dur: 12, shape: 'tri'    },
  { x: 80,  y: 30,  size: 6,   delay: 2.0, dur: 9,  shape: 'circle' },
  { x: 15,  y: 55,  size: 9,   delay: 0.5, dur: 14, shape: 'hex'    },
  { x: 92,  y: 75,  size: 5,   delay: 3.5, dur: 8,  shape: 'tri'    },
  { x: 50,  y: 60,  size: 7,   delay: 1.8, dur: 11, shape: 'circle' },
  { x: 25,  y: 90,  size: 4,   delay: 0.3, dur: 7,  shape: 'hex'    },
] as const;

function ParticleShape({
  shape,
  size,
  color,
}: {
  shape: 'hex' | 'circle' | 'tri';
  size: number;
  color: string;
}) {
  if (shape === 'circle') {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: color,
          opacity: 0.6,
        }}
      />
    );
  }

  if (shape === 'tri') {
    return (
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft:   `${size / 2}px solid transparent`,
          borderRight:  `${size / 2}px solid transparent`,
          borderBottom: `${size}px solid ${color}`,
          opacity: 0.5,
        }}
      />
    );
  }

  // hexagon via SVG
  return (
    <svg
      width={size}
      height={size * 1.15}
      viewBox="0 0 52 60"
      fill="none"
      style={{ opacity: 0.55 }}
    >
      <polygon
        points="26,2 50,15 50,45 26,58 2,45 2,15"
        stroke={color}
        strokeWidth="3"
        fill="none"
      />
    </svg>
  );
}

export default function AiAmbientBackground({ aiState = 'idle' }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  // Derive styling per AI state
  const speedMultiplier = aiState === 'processing' ? 0.5 : aiState === 'done' ? 0.8 : 1;
  const opacityBoost    = aiState === 'processing' ? 1.6 : aiState === 'done' ? 1.2 : 1;

  const primaryColor = '#8EC3B0';
  const aiColor      = '#a78bfa';

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {PARTICLES.map((p, i) => {
        const color = i % 3 === 0 ? aiColor : primaryColor;
        const animDur = (p.dur * speedMultiplier).toFixed(1);
        const baseOpacity = Math.min(1, opacityBoost * 0.28);

        return (
          <div
            key={i}
            className="absolute eco-particle"
            style={{
              left:            `${p.x}%`,
              top:             `${p.y}%`,
              animationDelay:  `${p.delay}s`,
              animationDuration: `${animDur}s`,
              opacity: baseOpacity,
              filter: aiState === 'processing' ? `drop-shadow(0 0 4px ${color})` : 'none',
              transition: 'opacity 0.8s ease, filter 0.8s ease',
            }}
          >
            <ParticleShape shape={p.shape} size={p.size} color={color} />
          </div>
        );
      })}

      {/* Data-flow lines when processing */}
      {aiState === 'processing' && (
        <svg
          className="absolute inset-0 w-full h-full animate-fade-in"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ opacity: 0.06 }}
        >
          <line x1="0" y1="30" x2="100" y2="70"   stroke="#8EC3B0" strokeWidth="0.5" strokeDasharray="4 6" />
          <line x1="0" y1="70" x2="100" y2="30"   stroke="#a78bfa" strokeWidth="0.4" strokeDasharray="3 8" />
          <line x1="20" y1="0" x2="80"  y2="100"  stroke="#8EC3B0" strokeWidth="0.3" strokeDasharray="2 10" />
        </svg>
      )}
    </div>
  );
}
