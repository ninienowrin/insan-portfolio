"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { SectionHeading } from "./ui/SectionHeading";
import { personal } from "@/data/personal";
import { staggerContainer, staggerItem, customEase } from "@/lib/animations";
import { useReducedMotion } from "@/hooks/useReducedMotion";

function CountUp({ target, suffix = "" }: { target: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reducedMotion = useReducedMotion();
  const [display, setDisplay] = useState("0");

  const numericPart = parseFloat(target.replace(/[^0-9.]/g, ""));
  const hasPlus = target.includes("+");

  useEffect(() => {
    if (!inView) return;
    if (reducedMotion) {
      setDisplay(target);
      return;
    }

    let start = 0;
    const duration = 1500;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (numericPart - start) * eased;

      if (Number.isInteger(numericPart)) {
        setDisplay(Math.round(current) + (hasPlus ? "+" : "") + suffix);
      } else {
        setDisplay(current.toFixed(2) + (hasPlus ? "+" : "") + suffix);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [inView, numericPart, hasPlus, suffix, target, reducedMotion]);

  return <span ref={ref}>{display}</span>;
}

export function AboutSection() {
  return (
    <section id="about" className="relative py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading label="About" title="Bridging Deep Learning and Transportation Safety" />

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-16">
          {/* Photo placeholder */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: customEase }}
            className="lg:col-span-4"
          >
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-bg-secondary border border-border-subtle group">
              <div className="absolute inset-0 bg-gradient-to-br from-accent-cyan/5 to-accent-violet/5" />
              {/* Fallback initials (behind the photo) */}
              <div className="absolute inset-0 flex items-center justify-center z-0">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto rounded-full bg-bg-tertiary border border-border-subtle flex items-center justify-center mb-3">
                    <span className="text-3xl font-heading font-bold text-accent-cyan">IA</span>
                  </div>
                </div>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={personal.profileImage}
                alt={`${personal.name} — PhD Researcher at UCF`}
                className="absolute inset-0 w-full h-full object-cover z-10"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              {/* Decorative border glow */}
              <div className="absolute inset-0 rounded-2xl ring-1 ring-accent-cyan/10" />
            </div>
          </motion.div>

          {/* Bio content */}
          <div className="lg:col-span-8">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              className="space-y-5"
            >
              {personal.bio.map((paragraph, i) => (
                <motion.p
                  key={i}
                  variants={staggerItem}
                  className="text-text-secondary leading-relaxed"
                >
                  {paragraph}
                </motion.p>
              ))}
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
              className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4"
            >
              {personal.stats.map((stat) => (
                <motion.div
                  key={stat.label}
                  variants={staggerItem}
                  className="rounded-xl bg-bg-secondary border border-border-subtle p-4 text-center"
                >
                  <div className="text-2xl font-heading font-bold text-accent-cyan">
                    <CountUp target={stat.value} />
                  </div>
                  <div className="text-xs text-text-secondary mt-1 font-mono uppercase tracking-wider">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
