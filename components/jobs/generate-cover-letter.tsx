"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function GenerateCoverLetterButton({
  jobId,
  resumeId,
}: {
  jobId: string;
  resumeId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    const res = await fetch("/api/cover-letter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobApplicationId: jobId, resumeId }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      alert(data.error ?? "Failed");
      return;
    }
    router.push(`/dashboard/cover-letters/${data.letter.id}`);
  }

  return (
    <Button size="sm" variant="secondary" onClick={generate} disabled={loading}>
      {loading ? "Generating…" : "Generate cover letter"}
    </Button>
  );
}
