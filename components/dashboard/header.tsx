"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function DashboardHeader({ userEmail }: { userEmail: string }) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="h-14 border-b border-white/10 bg-slate-950/50 backdrop-blur-md flex items-center justify-between px-6 relative z-20">
      <span className="text-sm text-white/50">{userEmail}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={signOut}
        className="text-white/60 hover:text-white hover:bg-white/10"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sign out
      </Button>
    </header>
  );
}
