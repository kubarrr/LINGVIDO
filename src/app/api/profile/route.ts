import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Auto-create profile if trigger didn't fire (e.g. schema run after registration)
  if (error?.code === "PGRST116" || !data) {
    const username = user.user_metadata?.username
      ?? user.email?.split("@")[0]
      ?? "user";

    const { data: created, error: createError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        username,
        target_language: "en",
        native_language: "pl",
        level: "A1",
        language_pairs: [],
      })
      .select()
      .single();

    if (createError) return NextResponse.json({ error: createError.message }, { status: 500 });
    return NextResponse.json(created);
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const allowed = ["username", "target_language", "native_language", "level", "avatar_url", "language_pairs"];
  const updates = Object.fromEntries(
    Object.entries(body).filter(([key]) => allowed.includes(key))
  );

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
