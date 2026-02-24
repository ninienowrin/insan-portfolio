"use client";

import dynamic from "next/dynamic";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useEffect, useState, useCallback } from "react";

const HeroScene = dynamic(
  () => import("./HeroScene").then((mod) => mod.HeroScene),
  { ssr: false }
);

function Loader({ fading }: { fading: boolean }) {
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center bg-bg-primary transition-opacity duration-700 ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{ zIndex: 2 }}
    >
      <div className="relative w-28 h-28">
        {/* Concentric rings */}
        {[1, 0.7, 0.4].map((scale, i) => (
          <div
            key={i}
            className="absolute inset-0 rounded-full border border-accent-cyan/20"
            style={{ transform: `scale(${scale})` }}
          />
        ))}
        {/* Sweep line */}
        <div
          className="absolute inset-0 origin-center"
          style={{ animation: "spin 2s linear infinite" }}
        >
          <div
            className="absolute left-1/2 top-0 h-1/2 w-px origin-bottom"
            style={{
              background:
                "linear-gradient(to top, rgba(6,182,212,0.6), transparent)",
            }}
          />
        </div>
        {/* Center dot */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-accent-cyan" />
        {/* Label */}
        <p className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-mono text-text-tertiary tracking-widest uppercase whitespace-nowrap">
          Initializing
        </p>
      </div>
    </div>
  );
}

export function RadarCanvas() {
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [loaderFading, setLoaderFading] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleReady = useCallback(() => {
    // Start fade-out, then remove loader
    setLoaderFading(true);
    setTimeout(() => setSceneReady(true), 700);
  }, []);

  const show3D = mounted && !reducedMotion;

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {show3D && (
        <div className="absolute inset-0" style={{ pointerEvents: "auto" }}>
          <HeroScene onReady={handleReady} />
        </div>
      )}

      {/* Loader — shown until 3D scene renders */}
      {show3D && !sceneReady && <Loader fading={loaderFading} />}

      {/* Scanline overlay — subtle CRT/radar display feel */}
      {show3D && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(6, 182, 212, 0.018) 3px, rgba(6, 182, 212, 0.018) 4px)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Gradient masking — light on desktop (scene is shifted right), stronger on mobile */}
      <div className="absolute inset-y-0 left-0 w-[30%] sm:w-[25%] bg-gradient-to-r from-bg-primary via-bg-primary/50 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-bg-primary to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-bg-primary/40 to-transparent pointer-events-none" />

      {/* Extra mobile overlay — text needs clean background on small screens */}
      <div className="absolute inset-y-0 left-0 w-full sm:hidden bg-bg-primary/40 pointer-events-none" />
    </div>
  );
}
