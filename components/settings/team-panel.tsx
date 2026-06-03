"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TeamPanel({
  members,
  canInvite,
  seatLimit,
}: {
  members: { id: string; role: string; profiles?: { full_name: string | null; email: string | null } }[];
  canInvite: boolean;
  seatLimit: number;
}) {
  const [email, setEmail] = useState("");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/team/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setInviteUrl(data.inviteUrl);
    setEmail("");
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-white/50">
        {members.length} / {seatLimit} seats used
      </p>
      <ul className="space-y-2">
        {members.map((m) => (
          <li
            key={m.id}
            className="text-sm border border-white/10 rounded-md p-3 flex justify-between text-white/90"
          >
            <span>
              {m.profiles?.full_name ?? m.profiles?.email ?? "Member"}
            </span>
            <span className="text-white/50 capitalize">{m.role}</span>
          </li>
        ))}
      </ul>
      {canInvite && (
        <form onSubmit={sendInvite} className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label className="text-white/80">Invite by email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white/5 border-white/15 text-white"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {inviteUrl && (
            <p className="text-sm break-all">
              Invite link: <a href={inviteUrl} className="text-primary underline">{inviteUrl}</a>
            </p>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? "Sending…" : "Create invite"}
          </Button>
        </form>
      )}
    </div>
  );
}
