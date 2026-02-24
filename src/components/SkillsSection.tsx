"use client";

import { motion } from "framer-motion";
import { SectionHeading } from "./ui/SectionHeading";
import { skillCategories } from "@/data/skills";
import { staggerContainer, staggerItem, customEase } from "@/lib/animations";
import { cn } from "@/lib/utils";

const headerColors: Record<string, string> = {
  cyan: "from-accent-cyan/10 to-transparent border-accent-cyan/20",
  blue: "from-accent-blue/10 to-transparent border-accent-blue/20",
  violet: "from-accent-violet/10 to-transparent border-accent-violet/20",
  amber: "from-accent-amber/10 to-transparent border-accent-amber/20",
};

const tagHoverColors: Record<string, string> = {
  cyan: "hover:border-accent-cyan/40 hover:text-accent-cyan hover:shadow-accent-cyan/5",
  blue: "hover:border-accent-blue/40 hover:text-accent-blue hover:shadow-accent-blue/5",
  violet: "hover:border-accent-violet/40 hover:text-accent-violet hover:shadow-accent-violet/5",
  amber: "hover:border-accent-amber/40 hover:text-accent-amber hover:shadow-accent-amber/5",
};

const nameColors: Record<string, string> = {
  cyan: "text-accent-cyan",
  blue: "text-accent-blue",
  violet: "text-accent-violet",
  amber: "text-accent-amber",
};

const countColors: Record<string, string> = {
  cyan: "text-accent-cyan/50",
  blue: "text-accent-blue/50",
  violet: "text-accent-violet/50",
  amber: "text-accent-amber/50",
};

export function SkillsSection() {
  return (
    <section id="skills" className="relative py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading label="Skills" title="Technical Skills" />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="grid md:grid-cols-2 gap-4 sm:gap-6"
        >
          {skillCategories.map((category) => (
            <motion.div
              key={category.id}
              variants={staggerItem}
              className="rounded-xl border border-border-subtle bg-bg-secondary overflow-hidden"
            >
              {/* Category header */}
              <div
                className={cn(
                  "px-4 py-2.5 sm:px-5 sm:py-3 bg-gradient-to-r border-b flex items-center justify-between",
                  headerColors[category.color]
                )}
              >
                <h3
                  className={cn(
                    "font-heading font-semibold text-sm",
                    nameColors[category.color]
                  )}
                >
                  {category.name}
                </h3>
                <span
                  className={cn(
                    "text-xs font-mono",
                    countColors[category.color]
                  )}
                >
                  {category.skills.length}
                </span>
              </div>

              {/* Skills grid */}
              <div className="p-3.5 sm:p-5">
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {category.skills.map((skill) => (
                    <span
                      key={skill}
                      className={cn(
                        "px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-mono text-text-secondary",
                        "border border-border-subtle bg-bg-primary",
                        "transition-all duration-200 hover:shadow-md cursor-default",
                        tagHoverColors[category.color]
                      )}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
