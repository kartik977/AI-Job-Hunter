"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { PremiumShell } from "@/components/visuals/premium-shell";
import { GlassCard } from "@/components/visuals/glass-card";
import { fadeInUp, staggerContainer } from "@/components/animations/motion";

export function MarketingHero() {
  return (
    <PremiumShell variant="hero" dark className="container mx-auto px-4 py-12 md:py-20">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="text-center lg:text-left"
      >
        <motion.p
          variants={fadeInUp}
          className="text-sm font-medium text-teal-300 mb-4 inline-block px-4 py-1.5 rounded-full border border-teal-400/30 bg-teal-500/10"
        >
          Free ATS resume optimizer
        </motion.p>
        <motion.h1
          variants={fadeInUp}
          className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight"
        >
          Beat ATS filters with{" "}
          <span className="bg-gradient-to-r from-teal-300 via-violet-300 to-pink-300 bg-clip-text text-transparent">
            AI-powered
          </span>{" "}
          resume optimization
        </motion.h1>
        <motion.p
          variants={fadeInUp}
          className="mt-6 text-lg text-white/70 max-w-xl mx-auto lg:mx-0"
        >
          Score, optimize, and export polished resumes—free, with a local AI engine
          and no API cost.
        </motion.p>
        <motion.div
          variants={fadeInUp}
          className="mt-10 flex flex-wrap justify-center lg:justify-start gap-4"
        >
          <Link href="/signup">
            <Button
              size="lg"
              className="shadow-lg shadow-teal-500/30 bg-gradient-to-r from-teal-500 to-violet-600 hover:from-teal-400 hover:to-violet-500 border-0"
            >
              Start free
            </Button>
          </Link>
          <Link href="/pricing">
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 bg-transparent"
            >
              View pricing
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </PremiumShell>
  );
}
