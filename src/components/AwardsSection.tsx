"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Award, Users, FileCheck, Quote, Camera } from "lucide-react";
import { SectionHeading } from "./ui/SectionHeading";
import { Lightbox } from "./ui/Lightbox";
import { testimonial } from "@/data/personal";
import { events } from "@/data/events";
import type { EventShowcase } from "@/data/events";
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

function EventCard({ event, index }: { event: EventShowcase; index: number }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const isEven = index % 2 === 0;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.6, ease: customEase, delay: index * 0.15 }}
        className="rounded-2xl border border-border-subtle bg-bg-secondary overflow-hidden group"
      >
        <div className="grid md:grid-cols-5">
          {/* Hero image — takes 3 columns */}
          <div
            className={`relative md:col-span-3 aspect-[16/10] md:aspect-auto md:min-h-[300px] overflow-hidden cursor-pointer ${
              !isEven ? "md:order-2" : ""
            }`}
            onClick={() => setLightboxIndex(0)}
          >
            <img
              src={event.heroImage.src}
              alt={event.heroImage.alt}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
            {/* Gradient overlay — fades toward text side */}
            <div
              className={`absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent ${
                isEven
                  ? "md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-bg-secondary/80"
                  : "md:bg-gradient-to-l md:from-transparent md:via-transparent md:to-bg-secondary/80"
              }`}
            />

            {/* Badge on hero */}
            <div className="absolute bottom-3 left-3 md:top-3 md:bottom-auto flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-medium uppercase tracking-wider border backdrop-blur-sm ${event.badgeClasses}`}
              >
                {event.badge}
              </span>
            </div>

            {/* Photo count indicator */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(0);
              }}
              className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white/80 text-xs font-mono hover:bg-black/70 transition-colors"
            >
              <Camera size={13} />
              {event.gallery.length}
            </button>
          </div>

          {/* Text content — takes 2 columns */}
          <div
            className={`md:col-span-2 p-5 md:p-6 flex flex-col justify-center ${
              !isEven ? "md:order-1" : ""
            }`}
          >
            <p className="text-xs text-text-tertiary font-mono mb-2">
              {event.date}
            </p>
            <h3 className="font-heading font-bold text-text-primary text-lg mb-1">
              {event.title}
            </h3>
            <p className="text-sm text-accent-cyan font-mono mb-3">
              {event.role}
            </p>
            <p className="text-sm text-text-secondary leading-relaxed mb-5">
              {event.description}
            </p>

            {/* Thumbnail row */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {event.gallery.map((photo, i) => (
                <button
                  key={photo.src}
                  onClick={() => setLightboxIndex(i)}
                  className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    i === 0
                      ? "border-accent-cyan/50"
                      : "border-transparent hover:border-accent-cyan/30"
                  }`}
                >
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          images={event.gallery}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}

export function AwardsSection() {
  return (
    <section id="awards" className="relative py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading label="Recognition" title="Highlights & Recognition" />

        {/* Event showcases */}
        <div className="space-y-6 mb-10">
          {events.map((event, i) => (
            <EventCard key={event.id} event={event} index={i} />
          ))}
        </div>

        {/* Testimonial — connected to ITE SLS event */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: customEase }}
          className="mb-10 rounded-2xl border border-accent-cyan/15 bg-bg-secondary p-6 md:p-8 relative overflow-hidden"
        >
          <Quote
            size={60}
            className="absolute -top-2 -right-2 text-accent-cyan/[0.06]"
          />
          <blockquote className="relative max-w-3xl mx-auto text-center">
            <p className="text-text-primary text-lg md:text-xl leading-relaxed italic mb-5">
              &ldquo;{testimonial.quote}&rdquo;
            </p>
            <footer className="flex items-center justify-center gap-3">
              <div className="w-9 h-9 rounded-full bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center">
                <span className="text-xs font-heading font-bold text-accent-cyan">
                  {testimonial.author
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
              </div>
              <div className="text-left">
                <cite className="not-italic text-sm font-medium text-text-primary">
                  {testimonial.author}
                </cite>
                <p className="text-xs text-text-secondary">
                  {testimonial.role} — {testimonial.context}
                </p>
              </div>
            </footer>
          </blockquote>
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
