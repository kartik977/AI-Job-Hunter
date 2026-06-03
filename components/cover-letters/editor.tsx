"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function CoverLetterEditor({
  letterId,
  initialContent,
}: {
  letterId: string;
  initialContent: string;
}) {
  const [content, setContent] = useState(initialContent);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    const supabase = createClient();
    await supabase
      .from("cover_letters")
      .update({ content, updated_at: new Date().toISOString() })
      .eq("id", letterId);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <Textarea
        rows={20}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="font-mono text-sm"
      />
      <Button onClick={save} disabled={loading}>
        {loading ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}
