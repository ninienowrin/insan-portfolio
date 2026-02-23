"use client";

import { motion } from "framer-motion";
import { customEase } from "@/lib/animations";

interface SectionHeadingProps {
  label: string;
  title: string;
  className?: string;
}

export function SectionHeading({ label, title, className = "" }: SectionHeadingProps) {
  return (
    <div className={`mb-12 md:mb-16 ${className}`}>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.4, ease: customEase }}
        className="flex items-center gap-3 mb-4"
      >
        <span className="h-px w-8 bg-accent-cyan" />
        <span className="text-xs font-medium tracking-[0.15em] uppercase text-accent-cyan font-mono">
          {label}
        </span>
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.6, ease: customEase, delay: 0.1 }}
        className="text-3xl md:text-4xl font-heading font-bold text-text-primary tracking-tight"
      >
        {title}
      </motion.h2>
    </div>
  );
}
