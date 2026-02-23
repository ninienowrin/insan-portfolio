"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Linkedin, GraduationCap, MapPin, Copy, Check } from "lucide-react";
import { SectionHeading } from "./ui/SectionHeading";
import { personal } from "@/data/personal";
import { staggerContainer, staggerItem, customEase } from "@/lib/animations";

const socialLinks = [
  {
    icon: <Linkedin size={20} />,
    label: "LinkedIn",
    href: personal.linkedin,
    hoverColor: "hover:text-[#0A66C2]",
  },
  {
    icon: <GraduationCap size={20} />,
    label: "Google Scholar",
    href: personal.googleScholar,
    hoverColor: "hover:text-[#4285F4]",
  },
];

export function ContactSection() {
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    await navigator.clipboard.writeText(personal.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="contact" className="relative py-24 md:py-32 bg-bg-secondary">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <SectionHeading
          label="Contact"
          title="Get in Touch"
          className="text-center [&>div:first-child]:justify-center"
        />

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: customEase, delay: 0.2 }}
          className="text-text-secondary text-lg mb-10 max-w-lg mx-auto"
        >
          Open to research collaborations, academic positions, and industry
          partnerships.
        </motion.p>

        {/* Email */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: customEase, delay: 0.3 }}
          className="mb-10"
        >
          <a
            href={`mailto:${personal.email}`}
            className="text-xl sm:text-2xl font-heading font-semibold text-accent-cyan hover:underline underline-offset-4"
          >
            {personal.email}
          </a>
          <button
            onClick={copyEmail}
            className="ml-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-text-secondary border border-border-subtle hover:border-text-tertiary/30 transition-colors"
            aria-label="Copy email to clipboard"
          >
            {copied ? (
              <>
                <Check size={14} className="text-green-400" />
                Copied
              </>
            ) : (
              <>
                <Copy size={14} />
                Copy
              </>
            )}
          </button>
        </motion.div>

        {/* Location */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex items-center justify-center gap-2 text-sm text-text-secondary mb-8"
        >
          <MapPin size={14} />
          {personal.location}
        </motion.div>

        {/* Social links */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex items-center justify-center gap-3"
        >
          {socialLinks.map((link) => (
            <motion.a
              key={link.label}
              variants={staggerItem}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center w-11 h-11 rounded-xl border border-border-subtle bg-bg-primary text-text-secondary transition-all duration-200 hover:-translate-y-0.5 ${link.hoverColor}`}
              aria-label={link.label}
            >
              {link.icon}
            </motion.a>
          ))}
          <motion.a
            variants={staggerItem}
            href={`mailto:${personal.email}`}
            className="flex items-center justify-center w-11 h-11 rounded-xl border border-border-subtle bg-bg-primary text-text-secondary transition-all duration-200 hover:-translate-y-0.5 hover:text-accent-cyan"
            aria-label="Email"
          >
            <Mail size={20} />
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
