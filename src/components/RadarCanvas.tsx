"use client";

import dynamic from "next/dynamic";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useEffect, useState } from "react";

const HeroScene = dynamic(
  () => import("./HeroScene").then((mod) => mod.HeroScene),
  { ssr: false }
);

export function RadarCanvas() {
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const show3D = mounted && !reducedMotion;

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {show3D && (
        <div className="absolute inset-0" style={{ pointerEvents: "auto" }}>
          <HeroScene />
        </div>
      )}

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
