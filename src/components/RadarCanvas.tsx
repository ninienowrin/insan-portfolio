"use client";

import dynamic from "next/dynamic";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const HeroScene = dynamic(
  () => import("./HeroScene").then((mod) => mod.HeroScene),
  { ssr: false }
);

export function RadarCanvas() {
  const reducedMotion = useReducedMotion();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Only show 3D scene in dark mode — additive blending doesn't work on light bg
  const show3D = mounted && !reducedMotion && resolvedTheme === "dark";

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      {show3D && (
        <div className="absolute inset-0 opacity-70">
          <HeroScene />
        </div>
      )}

      {/* Gradient masking for text readability */}
      <div className="absolute inset-y-0 left-0 w-[55%] bg-gradient-to-r from-bg-primary via-bg-primary/70 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-bg-primary to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-bg-primary/50 to-transparent" />
    </div>
  );
}
