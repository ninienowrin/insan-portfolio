"use client";

import { motion } from "framer-motion";
import { Radar, Box, Smartphone, Eye } from "lucide-react";
import { SectionHeading } from "./ui/SectionHeading";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { researchProjects } from "@/data/research";
import { staggerContainer, staggerItem } from "@/lib/animations";

const iconMap: Record<string, React.ReactNode> = {
  Radar: <Radar size={24} />,
  Box: <Box size={24} />,
  Smartphone: <Smartphone size={24} />,
  Eye: <Eye size={24} />,
};

const colorClasses: Record<string, string> = {
  cyan: "text-accent-cyan",
  blue: "text-accent-blue",
  violet: "text-accent-violet",
  amber: "text-accent-amber",
};

export function ResearchSection() {
  return (
    <section id="research" className="relative py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading label="Research" title="Research Focus" />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="grid md:grid-cols-2 gap-6"
        >
          {researchProjects.map((project) => (
            <motion.div key={project.id} variants={staggerItem}>
              <Card accentColor={project.color} className="h-full">
                <div className="flex items-start gap-4">
                  <div
                    className={`flex-shrink-0 p-2.5 rounded-lg bg-bg-tertiary ${colorClasses[project.color]}`}
                  >
                    {iconMap[project.icon]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-heading font-semibold text-text-primary text-lg">
                        {project.title}
                      </h3>
                      {project.funding && (
                        <Badge variant={project.color}>{project.funding}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed mb-4">
                      {project.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {project.tags.map((tag) => (
                        <Badge key={tag}>{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
