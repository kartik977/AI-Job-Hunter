"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NewJobForm({ orgId, userId }: { orgId: string; userId: string }) {
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("job_applications")
      .insert({
        organization_id: orgId,
        user_id: userId,
        company,
        title,
        url: url || null,
        status: "saved",
      })
      .select()
      .single();
    setLoading(false);
    if (!error && data) {
      router.push(`/dashboard/jobs/${data.id}`);
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 max-w-md">
      <div className="space-y-2">
        <Label className="text-white/80">Company</Label>
        <Input
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          required
          className="bg-white/5 border-white/15 text-white"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-white/80">Job title</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="bg-white/5 border-white/15 text-white"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-white/80">URL (optional)</Label>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          type="url"
          className="bg-white/5 border-white/15 text-white"
        />
      </div>
      <Button
        type="submit"
        disabled={loading}
        className="bg-gradient-to-r from-teal-500 to-violet-600 border-0"
      >
        {loading ? "Saving…" : "Add job"}
      </Button>
    </form>
  );
}
