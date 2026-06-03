"use client";

import { motion } from "framer-motion";
import { Sparkles, Target, FileCheck, Users, type LucideIcon } from "lucide-react";
import { GlassCard } from "@/components/visuals/glass-card";
import { fadeInUp, staggerContainer, HoverLift } from "@/components/animations/motion";

const features: {
  icon: LucideIcon;
  title: string;
  desc: string;
}[] = [
  {
    icon: Target,
    title: "ATS scoring",
    desc: "Keyword match, section issues, and prioritized fixes.",
  },
  {
    icon: Sparkles,
    title: "Smart optimization",
    desc: "Keyword-aware rewrites via free local engine.",
  },
  {
    icon: FileCheck,
    title: "Version history",
    desc: "Track every resume iteration and export PDFs.",
  },
  {
    icon: Users,
    title: "Teams",
    desc: "Shared workspace for coaches and teams.",
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="relative py-24 overflow-hidden bg-slate-950">
      <div className="container mx-auto px-4 relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl md:text-3xl font-bold text-center mb-12 text-white"
        >
          Everything you need to land the interview
        </motion.h2>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          variants={staggerContainer}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map(({ icon: Icon, title, desc }) => (
            <motion.div key={title} variants={fadeInUp}>
              <HoverLift>
                <GlassCard className="p-6 h-full border-teal-500/10 hover:border-teal-400/30 hover:shadow-teal-500/10">
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.15 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Icon className="h-8 w-8 text-teal-400 mb-3" />
                  </motion.div>
                  <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                  <p className="text-sm text-white/60">{desc}</p>
                </GlassCard>
              </HoverLift>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
