"use client";

import { motion } from "framer-motion";
import { Award, Users, FileCheck, Quote, Mic } from "lucide-react";
import { SectionHeading } from "./ui/SectionHeading";
import { testimonial } from "@/data/personal";
import { staggerContainer, staggerItem, customEase } from "@/lib/animations";

const awards = [
  {
    icon: <Award size={20} />,
    title: "ORCGS Doctoral Fellowship",
    org: "University of Central Florida",
    period: "Aug 2024 — Jul 2025",
    color: "text-accent-amber",
  },
  {
    icon: <Award size={20} />,
    title: "Graduate Presentation Fellowship",
    org: "University of Central Florida",
    period: "2025",
    color: "text-accent-amber",
  },
  {
    icon: <Users size={20} />,
    title: "Outreach Coordinator — ITE Student Chapter",
    org: "University of Central Florida",
    period: "Aug 2025 — Present",
    color: "text-accent-cyan",
  },
  {
    icon: <FileCheck size={20} />,
    title: "Peer Reviewer",
    org: "TRB & IEEE Conferences",
    period: "Ongoing",
    color: "text-accent-violet",
  },
];

export function AwardsSection() {
  return (
    <section id="awards" className="relative py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading label="Recognition" title="Awards & Leadership" />

        {/* ITE SLS Featured Highlight + Testimonial */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: customEase }}
          className="mb-10 rounded-2xl border border-accent-cyan/20 bg-bg-secondary overflow-hidden"
        >
          <div className="grid md:grid-cols-2">
            {/* Event highlight */}
            <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-border-subtle">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-accent-cyan/10 text-accent-cyan">
                  <Mic size={20} />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-text-primary">
                    ITE FL-PR Student Leadership Summit 2026
                  </h3>
                  <p className="text-xs text-text-secondary font-mono">
                    Organizer & Moderator
                  </p>
                </div>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">
                Led the organizing effort and moderated the &ldquo;Ask Me Anything&rdquo; session
                with senior transportation engineers at the ITE Florida-Puerto Rico Student
                Leadership Summit — connecting students with industry leaders and fostering
                cross-chapter collaboration.
              </p>
            </div>

            {/* Testimonial */}
            <div className="p-6 md:p-8 flex flex-col justify-center relative">
              <Quote
                size={40}
                className="absolute top-4 right-4 text-accent-cyan/10"
              />
              <blockquote className="relative">
                <p className="text-text-primary leading-relaxed italic mb-4">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <footer className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center">
                    <span className="text-xs font-heading font-bold text-accent-cyan">
                      {testimonial.author
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <div>
                    <cite className="not-italic text-sm font-medium text-text-primary">
                      {testimonial.author}
                    </cite>
                    <p className="text-xs text-text-secondary">
                      {testimonial.role}
                    </p>
                  </div>
                </footer>
              </blockquote>
            </div>
          </div>
        </motion.div>

        {/* Awards grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {awards.map((award, i) => (
            <motion.div
              key={i}
              variants={staggerItem}
              className="rounded-xl border border-border-subtle bg-bg-secondary p-5 hover:border-text-tertiary/30 transition-colors"
            >
              <div className={`mb-3 ${award.color}`}>{award.icon}</div>
              <h3 className="font-heading font-semibold text-text-primary text-sm mb-1">
                {award.title}
              </h3>
              <p className="text-xs text-text-secondary">{award.org}</p>
              <p className="text-xs text-text-tertiary font-mono mt-2">
                {award.period}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
