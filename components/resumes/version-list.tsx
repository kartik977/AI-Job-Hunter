"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

type Version = {
  id: string;
  label: string;
  is_primary: boolean;
  created_at: string;
};

export function VersionList({
  resumeId,
  versions,
}: {
  resumeId: string;
  versions: Version[];
}) {
  const router = useRouter();
  const [exporting, setExporting] = useState<string | null>(null);

  async function setPrimary(versionId: string) {
    const supabase = createClient();
    await supabase
      .from("resume_versions")
      .update({ is_primary: false })
      .eq("resume_id", resumeId);
    await supabase
      .from("resume_versions")
      .update({ is_primary: true })
      .eq("id", versionId);
    router.refresh();
  }

  async function exportPdf(versionId: string) {
    setExporting(versionId);
    const res = await fetch("/api/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeVersionId: versionId }),
    });
    setExporting(null);
    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? "Export failed");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resume.pdf";
    a.click();
  }

  return (
    <ul className="space-y-3">
      {versions.map((v) => (
        <li
          key={v.id}
          className="flex items-center justify-between border rounded-lg p-4"
        >
          <div>
            <p className="font-medium">{v.label}</p>
            <p className="text-xs text-muted-foreground">{formatDate(v.created_at)}</p>
          </div>
          <div className="flex items-center gap-2">
            {v.is_primary && <Badge>Primary</Badge>}
            {!v.is_primary && (
              <Button size="sm" variant="outline" onClick={() => setPrimary(v.id)}>
                Set primary
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              onClick={() => exportPdf(v.id)}
              disabled={exporting === v.id}
            >
              {exporting === v.id ? "…" : "Export PDF"}
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
