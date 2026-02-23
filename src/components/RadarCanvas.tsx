"use client";

import dynamic from "next/dynamic";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const HeroScene = dynamic(
  () => import("./HeroScene").then((mod) => mod.HeroScene),
  { ssr: false }
);

export function RadarCanvas() {
  const reducedMotion = useReducedMotion();

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      {!reducedMotion && (
        <div className="absolute inset-0">
          <HeroScene />
        </div>
      )}

      {/* Gradient fade at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-bg-primary to-transparent" />
      {/* Gradient on left for text readability */}
      <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-bg-primary/80 to-transparent" />
    </div>
  );
}
