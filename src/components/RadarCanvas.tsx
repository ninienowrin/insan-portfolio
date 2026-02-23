"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// Seeded PRNG for deterministic values across server/client
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface DetectionDot {
  angle: number;
  radius: number;
  pulseDelay: number;
  size: number;
}

// Pre-compute deterministic dots
const rand = seededRandom(42);
const DOTS: DetectionDot[] = Array.from({ length: 18 }, () => ({
  angle: rand() * Math.PI * 2,
  radius: 0.2 + rand() * 0.7,
  pulseDelay: rand() * 5,
  size: 2 + rand() * 3,
}));

// Pre-compute radial line endpoints
const RADIAL_LINES = Array.from({ length: 12 }, (_, i) => {
  const angle = (i * Math.PI * 2) / 12;
  return {
    x2: (400 + Math.cos(angle) * 370).toFixed(4),
    y2: (400 + Math.sin(angle) * 370).toFixed(4),
  };
});

// Pre-compute sweep cone endpoint
const SWEEP_END_X = (400 + 370 * Math.cos(Math.PI / 6)).toFixed(4);
const SWEEP_END_Y = (400 + 370 * Math.sin(Math.PI / 6)).toFixed(4);

// Pre-compute dot positions
const DOT_POSITIONS = DOTS.map((dot) => ({
  x: (400 + Math.cos(dot.angle) * dot.radius * 360).toFixed(4),
  y: (400 + Math.sin(dot.angle) * dot.radius * 360).toFixed(4),
  r: dot.size.toFixed(4),
  rGlow: (dot.size * 2.5).toFixed(4),
  dur: `${(3 + dot.pulseDelay).toFixed(4)}s`,
}));

export function RadarCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container || reducedMotion || window.innerWidth <= 768) return;

    let animId: number;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const handleMouse = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
      targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 20;
    };

    const animate = () => {
      currentX += (targetX - currentX) * 0.05;
      currentY += (targetY - currentY) * 0.05;
      setOffset({ x: currentX, y: currentY });
      animId = requestAnimationFrame(animate);
    };

    container.addEventListener("mousemove", handleMouse);
    animId = requestAnimationFrame(animate);

    return () => {
      container.removeEventListener("mousemove", handleMouse);
      cancelAnimationFrame(animId);
    };
  }, [reducedMotion]);

  const rings = [0.15, 0.28, 0.42, 0.58, 0.75, 0.92];

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute left-1/2 top-1/2 w-[min(110vw,900px)] h-[min(110vh,900px)]"
        style={{
          transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
        }}
      >
        <svg viewBox="0 0 800 800" className="w-full h-full opacity-40">
          {/* Concentric rings */}
          {rings.map((r, i) => (
            <circle
              key={i}
              cx="400"
              cy="400"
              r={r * 380}
              fill="none"
              stroke="var(--color-accent-cyan)"
              strokeWidth="0.5"
              opacity={0.15 + i * 0.03}
            />
          ))}

          {/* Radial lines */}
          {RADIAL_LINES.map((line, i) => (
            <line
              key={`line-${i}`}
              x1="400"
              y1="400"
              x2={line.x2}
              y2={line.y2}
              stroke="var(--color-accent-cyan)"
              strokeWidth="0.3"
              opacity="0.1"
            />
          ))}

          {/* Center dot */}
          <circle cx="400" cy="400" r="3" fill="var(--color-accent-cyan)" opacity="0.6" />

          {/* Rotating sweep */}
          <g
            className={reducedMotion ? "" : "animate-radar-sweep"}
            style={{ transformOrigin: "400px 400px" }}
          >
            {/* Sweep cone */}
            <path
              d={`M 400 400 L 770 400 A 370 370 0 0 1 ${SWEEP_END_X} ${SWEEP_END_Y} Z`}
              fill="var(--color-accent-cyan)"
              opacity="0.06"
            />
            {/* Sweep line */}
            <line
              x1="400"
              y1="400"
              x2="770"
              y2="400"
              stroke="var(--color-accent-cyan)"
              strokeWidth="1.5"
              opacity="0.5"
            />
          </g>

          {/* Detection dots */}
          {DOT_POSITIONS.map((dot, i) => (
            <g key={`dot-${i}`}>
              <circle cx={dot.x} cy={dot.y} r={dot.r} fill="var(--color-accent-cyan)" opacity="0.6">
                {!reducedMotion && (
                  <animate
                    attributeName="opacity"
                    values="0.2;0.8;0.2"
                    dur={dot.dur}
                    repeatCount="indefinite"
                  />
                )}
              </circle>
              <circle cx={dot.x} cy={dot.y} r={dot.rGlow} fill="var(--color-accent-cyan)" opacity="0.08">
                {!reducedMotion && (
                  <animate
                    attributeName="opacity"
                    values="0.03;0.12;0.03"
                    dur={dot.dur}
                    repeatCount="indefinite"
                  />
                )}
              </circle>
            </g>
          ))}
        </svg>
      </div>

      {/* Gradient fade at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-bg-primary to-transparent" />
    </div>
  );
}
