"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const inputClass =
  "bg-white/5 border-white/15 text-white placeholder:text-white/30 focus:border-teal-400/50";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();

    if (mode === "signup") {
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      router.push("/dashboard");
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    }
    setLoading(false);
  }

  async function handleGoogle() {
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (err) setError(err.message);
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">
          {mode === "login" ? "Welcome back" : "Create account"}
        </h2>
        <p className="text-white/60 text-sm mt-1">
          {mode === "login"
            ? "Sign in to optimize your resumes"
            : "Start beating ATS filters today"}
        </p>
      </div>
      <Button
        variant="outline"
        className="w-full border-white/20 text-white hover:bg-white/10 bg-transparent"
        type="button"
        onClick={handleGoogle}
      >
        Continue with Google
      </Button>
      <div className="relative text-center text-xs text-white/40">
        <span className="bg-slate-900/80 px-2 relative z-10">or</span>
        <div className="absolute inset-x-0 top-1/2 border-t border-white/10" />
      </div>
      <form onSubmit={handleEmail} className="space-y-4">
        {mode === "signup" && (
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white/80">
              Full name
            </Label>
            <Input
              id="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className={inputClass}
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-white/80">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-white/80">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
            className={inputClass}
          />
        </div>
        {error && <p className="text-sm text-pink-400">{error}</p>}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            className="w-full bg-gradient-to-r from-teal-500 to-violet-600 border-0"
            type="submit"
            disabled={loading}
          >
            {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Sign up"}
          </Button>
        </motion.div>
      </form>
      <p className="text-center text-sm text-white/50">
        {mode === "login" ? (
          <>
            No account?{" "}
            <Link href="/signup" className="text-teal-400 hover:underline">
              Sign up
            </Link>
          </>
        ) : (
          <>
            Have an account?{" "}
            <Link href="/login" className="text-teal-400 hover:underline">
              Log in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
