import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Target } from "lucide-react";

export function MarketingHeader() {
  return (
    <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg text-white">
          <Target className="h-6 w-6 text-teal-400" />
          JobHunter AI
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-white/60">
          <Link href="/#features" className="hover:text-teal-300 transition-colors">
            Features
          </Link>
          <Link href="/pricing" className="hover:text-teal-300 transition-colors">
            Pricing
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10">
              Log in
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-gradient-to-r from-teal-500 to-violet-600 border-0 shadow-teal-500/25">
              Get started
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
