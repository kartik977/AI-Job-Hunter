"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const [status, setStatus] = useState<"loading" | "ready" | "done" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function check() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStatus("ready");
        setMessage("Sign in or create an account to accept this invite.");
        return;
      }
      setStatus("ready");
    }
    check();
  }, []);

  async function accept() {
    setStatus("loading");
    const res = await fetch("/api/team/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus("error");
      setMessage(data.error ?? "Failed to accept");
      return;
    }
    setStatus("done");
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Team invite</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{message || "Accept invitation to join the workspace."}</p>
          {status === "ready" && (
            <>
              <Button onClick={accept}>Accept invite</Button>
              <Button variant="outline" onClick={() => router.push(`/login?redirect=/invite/${token}`)}>
                Sign in first
              </Button>
            </>
          )}
          {status === "error" && (
            <Button variant="outline" onClick={() => router.push("/")}>
              Go home
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
