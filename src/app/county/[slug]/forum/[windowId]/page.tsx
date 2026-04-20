import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PostList } from "@/components/forum/PostList";

export default async function ArchivedForumPage({
  params,
}: {
  params: Promise<{ slug: string; windowId: string }>;
}) {
  const { slug, windowId } = await params;
  const supabase = await createClient();

  const { data: county } = await supabase
    .from("counties")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  if (!county) notFound();

  const { data: forumWindow } = await supabase
    .from("forum_windows")
    .select("*")
    .eq("id", windowId)
    .eq("county_id", county.id)
    .not("closed_at", "is", null)
    .single();

  if (!forumWindow) notFound();

  // Fetch all top-level posts
  const { data: topLevelPosts } = await supabase
    .from("posts")
    .select("*, profiles!inner(display_name)")
    .eq("forum_window_id", forumWindow.id)
    .is("parent_id", null)
    .order("created_at", { ascending: false });

  let posts: Array<{
    id: string;
    forum_window_id: string;
    author_id: string;
    parent_id: string | null;
    body: string;
    image_url: string | null;
    created_at: string;
    deleted_at: string | null;
    author_name: string;
    reply_count: number;
  }> = [];

  if (topLevelPosts) {
    const { data: replyCounts } = await supabase
      .from("posts")
      .select("parent_id")
      .eq("forum_window_id", forumWindow.id)
      .not("parent_id", "is", null)
      .is("deleted_at", null);

    const replyCountMap = new Map<string, number>();
    (replyCounts ?? []).forEach((r) => {
      const count = replyCountMap.get(r.parent_id!) ?? 0;
      replyCountMap.set(r.parent_id!, count + 1);
    });

    posts = topLevelPosts
      .filter((p) => !p.deleted_at || (replyCountMap.get(p.id) ?? 0) > 0)
      .map((p) => ({
        ...p,
        author_name: (p.profiles as { display_name: string }).display_name,
        reply_count: replyCountMap.get(p.id) ?? 0,
      }));
  }

  const isSighted = forumWindow.decision === "sighted";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <Link
          href={`/county/${slug}`}
          className="text-sm text-neutral-400 hover:text-neutral-200"
        >
          &larr; Back to {county.name} County
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-neutral-100">
          {forumWindow.hijri_month} {forumWindow.hijri_year} AH
        </h1>
        <p
          className={`mt-1 text-sm ${
            isSighted ? "text-green-400" : "text-neutral-500"
          }`}
        >
          {isSighted ? "Moon Sighted" : "Not Sighted"}
        </p>
      </div>

      <PostList
        posts={posts}
        forumWindowId={forumWindow.id}
        countySlug={slug}
        isLoggedIn={false}
      />

      {posts.length === 0 && (
        <p className="text-center text-neutral-400">
          No posts were made during this forum window.
        </p>
      )}
    </div>
  );
}
