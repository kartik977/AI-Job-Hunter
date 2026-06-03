"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { GlassCard } from "@/components/visuals/glass-card";
import { AnimatedMeshBg } from "@/components/visuals/animated-mesh-bg";
import { SceneIllustration } from "@/components/visuals/illustrations/scene-illustration";
import { fadeInUp, staggerContainer } from "@/components/animations/motion";

const features = [
  "ATS keyword scoring",
  "Resume optimization & versions",
  "PDF export",
  "Cover letter generator",
  "Job tracker Kanban",
  "Team invites",
  "No credit card — ever",
];

export default function PricingPage() {
  return (
    <div className="relative min-h-[80vh] py-16 overflow-hidden">
      <AnimatedMeshBg />
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
          <div className="hidden lg:block">
            <SceneIllustration variant="hero" />
          </div>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center lg:text-left mb-8">
              <h1 className="text-3xl font-bold text-white">Free for everyone</h1>
              <p className="text-white/60 mt-2">Premium experience. Zero cost.</p>
            </motion.div>
            <motion.div variants={fadeInUp}>
              <GlassCard className="p-8 border-teal-500/30">
                <p className="text-4xl font-bold text-white">
                  $0
                  <span className="text-lg font-normal text-white/50"> forever</span>
                </p>
                <ul className="space-y-3 mt-6">
                  {features.map((f, i) => (
                    <motion.li
                      key={f}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.05 }}
                      className="flex items-center gap-2 text-sm text-white/80"
                    >
                      <Check className="h-4 w-4 text-teal-400 shrink-0" />
                      {f}
                    </motion.li>
                  ))}
                </ul>
                <Link href="/signup" className="block mt-8">
                  <Button className="w-full bg-gradient-to-r from-teal-500 to-violet-600 border-0">
                    Create free account
                  </Button>
                </Link>
              </GlassCard>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
