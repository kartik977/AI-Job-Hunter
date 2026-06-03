import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: resumes } = await admin
    .from("resumes")
    .select("storage_path")
    .eq("user_id", user.id);

  const paths = (resumes ?? [])
    .map((r) => r.storage_path)
    .filter(Boolean) as string[];

  if (paths.length) {
    await admin.storage.from("resumes").remove(paths);
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
