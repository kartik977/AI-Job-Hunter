"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Target,
  LayoutDashboard,
  FileText,
  Sparkles,
  Briefcase,
  Mail,
  Settings,
  CreditCard,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/resumes", label: "Resumes", icon: FileText },
  { href: "/dashboard/optimize/new", label: "ATS Analyze", icon: Sparkles },
  { href: "/dashboard/jobs", label: "Job Tracker", icon: Briefcase },
  { href: "/dashboard/cover-letters", label: "Cover Letters", icon: Mail },
];

const settingsLinks = [
  { href: "/settings/profile", label: "Profile", icon: Settings },
  { href: "/settings/billing", label: "Billing", icon: CreditCard },
  { href: "/settings/team", label: "Team", icon: Users },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-white/10 bg-slate-950/60 backdrop-blur-xl min-h-screen p-4 flex flex-col relative z-20">
      <Link href="/dashboard" className="flex items-center gap-2 font-semibold mb-8 text-white group">
        <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
          <Target className="h-5 w-5 text-teal-400" />
        </motion.div>
        JobHunter AI
      </Link>
      <nav className="space-y-1 flex-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link key={href} href={href} className="block relative">
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-md bg-gradient-to-r from-teal-500/20 to-violet-500/10 border border-teal-400/20"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span
                className={cn(
                  "relative flex items-center gap-2 rounded-md px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "text-teal-300 font-medium"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
      <div className="pt-4 border-t border-white/10 space-y-1">
        <p className="text-xs text-white/30 px-3 mb-2">Settings</p>
        {settingsLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
              pathname.startsWith(href)
                ? "text-teal-300 bg-white/5"
                : "text-white/50 hover:text-white hover:bg-white/5"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
