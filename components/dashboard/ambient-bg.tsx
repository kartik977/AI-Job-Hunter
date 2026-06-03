"use client";

import { motion } from "framer-motion";

/** Subtle corner glows only — no center vignette (avoids the light “blob” on dashboard). */
export function DashboardAmbientBg() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <motion.div
        className="absolute -top-[20%] -left-[15%] w-[45%] h-[45%] rounded-full blur-[100px]"
        style={{
          background: "radial-gradient(circle, #2dd4bf 0%, transparent 70%)",
          opacity: 0.12,
        }}
        animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-[15%] -right-[10%] w-[40%] h-[40%] rounded-full blur-[110px]"
        style={{
          background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)",
          opacity: 0.1,
        }}
        animate={{ x: [0, -25, 0], y: [0, -15, 0] }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-[40%] right-[5%] w-[28%] h-[28%] rounded-full blur-[80px]"
        style={{
          background: "radial-gradient(circle, #ec4899 0%, transparent 70%)",
          opacity: 0.06,
        }}
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
