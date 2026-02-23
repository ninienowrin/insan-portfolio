"use client";

import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { RadarCanvas } from "./RadarCanvas";
import { personal } from "@/data/personal";
import { customEase } from "@/lib/animations";

export function HeroSection() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden">
      <RadarCanvas />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-2xl">
          {/* Eyebrow */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: customEase, delay: 0.3 }}
            className="text-xs sm:text-sm font-mono font-medium tracking-[0.15em] uppercase text-text-secondary mb-4"
          >
            {personal.title}
          </motion.p>

          {/* Name */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: customEase, delay: 0.5 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-text-primary tracking-tight mb-6"
          >
            {personal.name}
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: customEase, delay: 0.7 }}
            className="text-lg sm:text-xl text-text-secondary leading-relaxed mb-10 max-w-xl"
          >
            {personal.tagline}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: customEase, delay: 0.9 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <a
              href="#research"
              onClick={(e) => {
                e.preventDefault();
                document.querySelector("#research")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="inline-flex items-center justify-center px-7 py-3 rounded-lg bg-gradient-to-r from-accent-cyan to-accent-blue text-bg-primary font-semibold text-sm hover:shadow-lg hover:shadow-accent-cyan/20 transition-shadow"
            >
              View Research
            </a>
            <a
              href="/files/Insan_CV.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-7 py-3 rounded-lg border border-accent-cyan/40 text-accent-cyan font-semibold text-sm hover:bg-accent-cyan/10 transition-colors"
            >
              Download CV
            </a>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <button
          onClick={() =>
            document.querySelector("#about")?.scrollIntoView({ behavior: "smooth" })
          }
          className="flex flex-col items-center gap-2 text-text-tertiary hover:text-accent-cyan transition-colors"
          aria-label="Scroll to about section"
        >
          <span className="text-xs font-mono tracking-wider uppercase">Scroll</span>
          <ArrowDown size={16} className="animate-bounce-gentle" />
        </button>
      </motion.div>
    </section>
  );
}
