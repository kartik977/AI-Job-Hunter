"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileForm({
  fullName,
  email,
}: {
  fullName: string;
  email: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(fullName);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ full_name: name }).eq("id", user.id);
    }
    setLoading(false);
    router.refresh();
  }

  async function deleteAccount() {
    if (!confirm("Delete your account and all data? This cannot be undone.")) return;
    setDeleting(true);
    const res = await fetch("/api/account/delete", { method: "POST" });
    setDeleting(false);
    if (res.ok) {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = "/";
    } else {
      const data = await res.json();
      alert(data.error ?? "Delete failed");
    }
  }

  return (
    <div className="space-y-8 max-w-md">
      <form onSubmit={save} className="space-y-4">
        <div className="space-y-2">
          <Label className="text-white/80">Email</Label>
          <Input
            value={email}
            disabled
            className="bg-white/5 border-white/15 text-white/60"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-white/80">Full name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-white/5 border-white/15 text-white"
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-teal-500 to-violet-600 border-0"
        >
          {loading ? "Saving…" : "Save profile"}
        </Button>
      </form>
      <div className="border-t pt-6">
        <h3 className="font-medium text-pink-400 mb-2">Danger zone</h3>
        <Button variant="destructive" onClick={deleteAccount} disabled={deleting}>
          {deleting ? "Deleting…" : "Delete account"}
        </Button>
      </div>
    </div>
  );
}
