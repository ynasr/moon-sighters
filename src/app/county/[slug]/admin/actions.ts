"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function verifyAdmin(countySlug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null, county: null };

  const { data: county } = await supabase
    .from("counties")
    .select("id, slug")
    .eq("slug", countySlug)
    .single();

  if (!county) return { supabase, user, county: null };

  const { data: adminRecord } = await supabase
    .from("county_admins")
    .select("id")
    .eq("user_id", user.id)
    .eq("county_id", county.id)
    .single();

  if (!adminRecord) return { supabase, user, county: null };

  return { supabase, user, county };
}

export async function openForumWindow(formData: FormData) {
  const countySlug = formData.get("countySlug") as string;
  const hijriMonth = formData.get("hijriMonth") as string;
  const hijriYear = parseInt(formData.get("hijriYear") as string, 10);

  const { supabase, user, county } = await verifyAdmin(countySlug);
  if (!user || !county) return { error: "Unauthorized" };

  // Check no open window exists
  const { data: existing } = await supabase
    .from("forum_windows")
    .select("id")
    .eq("county_id", county.id)
    .is("closed_at", null)
    .single();

  if (existing) return { error: "A forum window is already open for this county" };

  const { error } = await supabase.from("forum_windows").insert({
    county_id: county.id,
    hijri_month: hijriMonth,
    hijri_year: hijriYear,
    opened_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath(`/county/${countySlug}`);
  revalidatePath("/");
  return { error: null };
}

export async function closeForumWindow(formData: FormData) {
  const countySlug = formData.get("countySlug") as string;
  const windowId = formData.get("windowId") as string;
  const decision = formData.get("decision") as "sighted" | "not_sighted";

  const { supabase, user, county } = await verifyAdmin(countySlug);
  if (!user || !county) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("forum_windows")
    .update({
      closed_at: new Date().toISOString(),
      decision,
      decided_at: new Date().toISOString(),
    })
    .eq("id", windowId);

  if (error) return { error: error.message };

  revalidatePath(`/county/${countySlug}`);
  revalidatePath("/");
  return { error: null };
}

export async function deletePost(formData: FormData) {
  const countySlug = formData.get("countySlug") as string;
  const postId = formData.get("postId") as string;

  const { supabase, user, county } = await verifyAdmin(countySlug);
  if (!user || !county) return { error: "Unauthorized" };

  const { error } = await supabase.rpc("soft_delete_post", {
    post_id: postId,
  });

  if (error) return { error: error.message };

  revalidatePath(`/county/${countySlug}`);
  return { error: null };
}
