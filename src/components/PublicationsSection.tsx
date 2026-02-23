"use client";

import { useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { ExternalLink, ChevronDown } from "lucide-react";
import { SectionHeading } from "./ui/SectionHeading";
import { Badge } from "./ui/Badge";
import {
  publications,
  publicationCounts,
  type PublicationType,
} from "@/data/publications";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem, customEase } from "@/lib/animations";

type FilterType = PublicationType | "all";

const filters: { label: string; value: FilterType }[] = [
  { label: "All", value: "all" },
  { label: "Journal", value: "journal" },
  { label: "Conference", value: "conference" },
  { label: "Under Review", value: "under-review" },
];

const statusStyles: Record<PublicationType, { label: string; variant: "cyan" | "blue" | "violet" | "amber" }> = {
  journal: { label: "Journal", variant: "cyan" },
  conference: { label: "Conference", variant: "blue" },
  "under-review": { label: "Under Review", variant: "amber" },
};

export function PublicationsSection() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered =
    filter === "all"
      ? publications
      : publications.filter((p) => p.type === filter);

  return (
    <section id="publications" className="relative py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading label="Publications" title="Publications" />

        {/* Filter bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, ease: customEase }}
          className="flex flex-wrap gap-2 mb-8"
        >
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setFilter(f.value);
                setExpandedId(null);
              }}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                filter === f.value
                  ? "bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30"
                  : "bg-bg-secondary text-text-secondary border border-border-subtle hover:text-text-primary hover:border-text-tertiary"
              )}
            >
              {f.label}{" "}
              <span className="text-xs opacity-60">
                ({publicationCounts[f.value]})
              </span>
            </button>
          ))}
        </motion.div>

        {/* Publication list */}
        <LayoutGroup>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.05 }}
            className="space-y-3"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((pub) => {
                const isExpanded = expandedId === pub.id;
                const status = statusStyles[pub.type];

                return (
                  <motion.div
                    key={pub.id}
                    layout
                    variants={staggerItem}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: customEase }}
                  >
                    <button
                      onClick={() =>
                        setExpandedId(isExpanded ? null : pub.id)
                      }
                      className={cn(
                        "w-full text-left rounded-xl border bg-bg-secondary p-4 sm:p-5 transition-all duration-200",
                        isExpanded
                          ? "border-accent-cyan/30 shadow-lg shadow-accent-cyan/5"
                          : "border-border-subtle hover:border-text-tertiary/30"
                      )}
                    >
                      {/* Main row */}
                      <div className="flex items-start gap-3">
                        <Badge variant={status.variant} className="mt-1 flex-shrink-0">
                          {status.label}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-text-primary leading-snug pr-8">
                            {pub.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-text-secondary">
                            <span>{pub.venue}</span>
                            <span className="text-text-tertiary">|</span>
                            <span>{pub.year}</span>
                          </div>
                        </div>
                        <ChevronDown
                          size={18}
                          className={cn(
                            "flex-shrink-0 text-text-tertiary transition-transform duration-200 mt-1",
                            isExpanded && "rotate-180"
                          )}
                        />
                      </div>

                      {/* Expanded content */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: customEase }}
                            className="overflow-hidden"
                          >
                            <div className="pt-4 mt-4 border-t border-border-subtle">
                              {/* Authors */}
                              <div className="mb-3">
                                <span className="text-xs font-mono text-text-tertiary uppercase tracking-wider">
                                  Authors
                                </span>
                                <p className="text-sm text-text-secondary mt-1">
                                  {pub.authors.map((author, i) => (
                                    <span key={i}>
                                      {i > 0 && ", "}
                                      <span
                                        className={
                                          author.includes("Insan")
                                            ? "text-accent-cyan font-medium"
                                            : ""
                                        }
                                      >
                                        {author}
                                      </span>
                                    </span>
                                  ))}
                                </p>
                              </div>

                              {/* Tags */}
                              <div className="flex flex-wrap gap-1.5 mb-3">
                                {pub.tags.map((tag) => (
                                  <Badge key={tag} variant="violet">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>

                              {/* DOI link */}
                              {pub.doi && (
                                <a
                                  href={`https://doi.org/${pub.doi}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1.5 text-sm text-accent-cyan hover:underline"
                                >
                                  <ExternalLink size={14} />
                                  View Publication
                                </a>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>
      </div>
    </section>
  );
}
