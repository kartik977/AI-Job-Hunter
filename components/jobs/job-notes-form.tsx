"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function JobNotesForm({
  jobId,
  initialNotes,
}: {
  jobId: string;
  initialNotes: string;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    const supabase = createClient();
    await supabase
      .from("job_applications")
      .update({ notes, updated_at: new Date().toISOString() })
      .eq("id", jobId);
    setLoading(false);
  }

  return (
    <div className="space-y-2">
      <Textarea
        rows={6}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Job description, interview notes, etc."
      />
      <Button size="sm" onClick={save} disabled={loading}>
        {loading ? "Saving…" : "Save notes"}
      </Button>
    </div>
  );
}
