import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { AnimatedMain } from "@/components/dashboard/animated-main";
import { DashboardAmbientBg } from "@/components/dashboard/ambient-bg";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="dark flex min-h-screen bg-slate-950 text-white relative overflow-hidden">
      <DashboardAmbientBg />
      <DashboardSidebar />
      <div className="flex-1 flex flex-col relative z-10 min-w-0">
        <DashboardHeader userEmail={user.email ?? ""} />
        <AnimatedMain className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 p-6 overflow-auto">{children}</div>
        </AnimatedMain>
      </div>
    </div>
  );
}
