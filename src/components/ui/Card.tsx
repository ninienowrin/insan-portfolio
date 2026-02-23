"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  accentColor?: "cyan" | "blue" | "violet" | "amber";
}

const accentBorders: Record<string, string> = {
  cyan: "border-l-accent-cyan hover:shadow-accent-cyan/10",
  blue: "border-l-accent-blue hover:shadow-accent-blue/10",
  violet: "border-l-accent-violet hover:shadow-accent-violet/10",
  amber: "border-l-accent-amber hover:shadow-accent-amber/10",
};

export function Card({
  children,
  className,
  hover = true,
  accentColor,
}: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -4 } : undefined}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "rounded-xl border border-border-subtle bg-bg-secondary p-6",
        hover &&
          "cursor-default transition-shadow duration-200 hover:shadow-lg hover:border-accent-cyan/20",
        accentColor && `border-l-[3px] ${accentBorders[accentColor]}`,
        className
      )}
    >
      {children}
    </motion.div>
  );
}
