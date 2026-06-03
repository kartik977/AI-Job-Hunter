import { notFound } from "next/navigation";
import { getCurrentOrgContext } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { CoverLetterEditor } from "@/components/cover-letters/editor";

export default async function CoverLetterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getCurrentOrgContext();
  if (!ctx) return null;

  const supabase = await createClient();
  const { data: letter } = await supabase
    .from("cover_letters")
    .select("*")
    .eq("id", id)
    .eq("organization_id", ctx.orgId)
    .single();

  if (!letter) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">{letter.title}</h1>
      <CoverLetterEditor letterId={letter.id} initialContent={letter.content} />
    </div>
  );
}
