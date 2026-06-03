import { MarketingHeader } from "@/components/marketing/header";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <MarketingHeader />
      <main>{children}</main>
      <footer className="border-t border-white/10 py-8 text-center text-sm text-white/50 bg-slate-950">
        <p>
          © {new Date().getFullYear()} JobHunter AI ·{" "}
          <a href="/privacy" className="hover:text-teal-300 transition-colors">
            Privacy
          </a>{" "}
          ·{" "}
          <a href="/terms" className="hover:text-teal-300 transition-colors">
            Terms
          </a>
        </p>
      </footer>
    </div>
  );
}
