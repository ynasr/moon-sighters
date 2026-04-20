"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createPost(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const body = formData.get("body") as string;
  const forumWindowId = formData.get("forumWindowId") as string;
  const countySlug = formData.get("countySlug") as string;
  const imageUrl = formData.get("imageUrl") as string | null;

  if (!body?.trim()) return { error: "Post body is required" };

  const { error } = await supabase.from("posts").insert({
    forum_window_id: forumWindowId,
    author_id: user.id,
    body: body.trim(),
    image_url: imageUrl || null,
  });

  if (error) {
    if (error.message.includes("Daily post limit")) {
      return { error: "You've reached your daily post limit (3 per day)" };
    }
    if (error.message.includes("Daily image post limit")) {
      return { error: "You've reached your daily image post limit (1 per day)" };
    }
    return { error: error.message };
  }

  revalidatePath(`/county/${countySlug}`);
  return { error: null };
}

export async function createReply(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const body = formData.get("body") as string;
  const parentId = formData.get("parentId") as string;
  const forumWindowId = formData.get("forumWindowId") as string;
  const countySlug = formData.get("countySlug") as string;

  if (!body?.trim()) return { error: "Reply body is required" };

  const { error } = await supabase.from("posts").insert({
    forum_window_id: forumWindowId,
    author_id: user.id,
    parent_id: parentId,
    body: body.trim(),
  });

  if (error) {
    if (error.message.includes("Daily reply limit")) {
      return { error: "You've reached your daily reply limit (3 per day)" };
    }
    return { error: error.message };
  }

  revalidatePath(`/county/${countySlug}`);
  return { error: null };
}

export async function getSignedUploadUrl(fileName: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated", url: null, path: null };

  const ext = fileName.split(".").pop();
  const path = `${user.id}/${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage
    .from("post-images")
    .createSignedUploadUrl(path);

  if (error) return { error: error.message, url: null, path: null };

  return { error: null, url: data.signedUrl, path };
}

export async function getPublicImageUrl(path: string) {
  const supabase = await createClient();
  const { data } = supabase.storage.from("post-images").getPublicUrl(path);
  return data.publicUrl;
}

export async function getRemainingLimits() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const { data: todayPosts } = await supabase
    .from("posts")
    .select("parent_id, image_url")
    .eq("author_id", user.id)
    .gte("created_at", todayStart.toISOString())
    .is("deleted_at", null);

  const posts = (todayPosts ?? []).filter((p) => !p.parent_id).length;
  const replies = (todayPosts ?? []).filter((p) => p.parent_id).length;
  const images = (todayPosts ?? []).filter((p) => p.image_url).length;

  return {
    posts: { used: posts, max: 3 },
    replies: { used: replies, max: 3 },
    images: { used: images, max: 1 },
  };
}
