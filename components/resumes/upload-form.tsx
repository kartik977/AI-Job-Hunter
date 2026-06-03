"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { ResumeLoadingIllustration } from "@/components/visuals/illustrations/scene-illustration";

export function ResumeUploadForm() {
  const router = useRouter();
  const [title, setTitle] = useState("My Resume");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) {
      setError("Select a file");
      return;
    }

    setLoading(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("title", title);

    const res = await fetch("/api/resumes/upload", { method: "POST", body: fd });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Upload failed");
      return;
    }

    router.push(`/dashboard/resumes/${data.resume.id}`);
    router.refresh();
  }

  return (
    <div className="relative">
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6"
          >
            <div className="w-full max-w-md">
              <ResumeLoadingIllustration />
            </div>
            <p className="mt-6 text-white/80 flex items-center gap-2 text-lg">
              <Loader2 className="h-5 w-5 animate-spin text-teal-400" />
              Parsing your resume…
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-white/80">
            Title
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
            className="bg-white/5 border-white/15 text-white placeholder:text-white/30"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="file" className="text-white/80">
            Resume (PDF or DOCX)
          </Label>
          <Input
            id="file"
            name="file"
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            required
            disabled={loading}
            className="bg-white/5 border-white/15 text-white file:text-teal-300"
          />
        </div>
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-pink-400"
          >
            {error}
          </motion.p>
        )}
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-teal-500 to-violet-600 border-0"
        >
          {loading ? "Uploading…" : "Upload & parse"}
        </Button>
      </form>
    </div>
  );
}
