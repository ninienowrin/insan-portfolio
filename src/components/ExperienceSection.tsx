"use client";

import { motion } from "framer-motion";
import { Briefcase, GraduationCap } from "lucide-react";
import { SectionHeading } from "./ui/SectionHeading";
import { Badge } from "./ui/Badge";
import { experiences } from "@/data/experience";
import { staggerContainer, staggerItem, customEase } from "@/lib/animations";
import { cn } from "@/lib/utils";

export function ExperienceSection() {
  return (
    <section id="experience" className="relative py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading label="Experience" title="Experience & Education" />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
          className="relative"
        >
          {/* Timeline line */}
          <div className="absolute left-[19px] md:left-[23px] top-2 bottom-2 w-px bg-border-subtle" />

          <div className="space-y-8">
            {experiences.map((exp) => (
              <motion.div
                key={exp.id}
                variants={staggerItem}
                className="relative pl-12 md:pl-16"
              >
                {/* Timeline dot */}
                <div
                  className={cn(
                    "absolute left-0 top-1.5 flex items-center justify-center",
                    "w-10 h-10 md:w-12 md:h-12 rounded-full border-2",
                    exp.current
                      ? "border-accent-cyan bg-accent-cyan/10 animate-pulse-ring"
                      : "border-border-subtle bg-bg-secondary"
                  )}
                >
                  {exp.type === "education" ? (
                    <GraduationCap
                      size={18}
                      className={
                        exp.current ? "text-accent-cyan" : "text-text-tertiary"
                      }
                    />
                  ) : (
                    <Briefcase
                      size={18}
                      className={
                        exp.current ? "text-accent-cyan" : "text-text-tertiary"
                      }
                    />
                  )}
                </div>

                {/* Content card */}
                <div className="rounded-xl border border-border-subtle bg-bg-secondary p-5 hover:border-text-tertiary/30 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 mb-2">
                    <div>
                      <h3 className="font-heading font-semibold text-text-primary">
                        {exp.role}
                      </h3>
                      <p className="text-sm text-text-secondary">
                        {exp.organization} — {exp.location}
                      </p>
                    </div>
                    <span className="text-xs font-mono text-text-tertiary whitespace-nowrap">
                      {exp.startDate} — {exp.endDate}
                    </span>
                  </div>

                  <ul className="space-y-1.5 mt-3">
                    {exp.description.map((item, i) => (
                      <li
                        key={i}
                        className="text-sm text-text-secondary leading-relaxed flex items-start gap-2"
                      >
                        <span className="w-1 h-1 rounded-full bg-accent-cyan mt-2 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {exp.tags.map((tag) => (
                      <Badge key={tag}>{tag}</Badge>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
