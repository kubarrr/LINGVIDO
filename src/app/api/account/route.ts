import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

// DELETE /api/account — permanently delete the signed-in user and all their data.
// Required by Google Play for apps with accounts.
export async function DELETE() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { error: "Account deletion is not configured (missing SUPABASE_SERVICE_ROLE_KEY)." },
      { status: 500 },
    );
  }

  const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Remove the user's uploaded images (DB rows cascade on user deletion)
  try {
    const { data: files } = await admin.storage.from("lesson-images").list(user.id);
    if (files && files.length > 0) {
      await admin.storage.from("lesson-images").remove(files.map((f) => `${user.id}/${f.name}`));
    }
  } catch { /* best effort */ }

  // Deleting the auth user cascades to profile → lessons / quiz_scores (FK on delete cascade)
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.auth.signOut();
  return NextResponse.json({ success: true });
}
