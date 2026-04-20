import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ForumStatus } from "@/components/forum/ForumStatus";
import { PostList } from "@/components/forum/PostList";
import { NewPostForm } from "@/components/forum/NewPostForm";
import { RateLimitIndicator } from "@/components/forum/RateLimitIndicator";

export default async function CountyForumPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch county
  const { data: county } = await supabase
    .from("counties")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  if (!county) notFound();

  // Fetch active forum window
  const { data: activeWindow } = await supabase
    .from("forum_windows")
    .select("*")
    .eq("county_id", county.id)
    .is("closed_at", null)
    .single();

  // Fetch all closed windows
  const { data: closedWindows } = await supabase
    .from("forum_windows")
    .select("*")
    .eq("county_id", county.id)
    .not("closed_at", "is", null)
    .order("closed_at", { ascending: false });

  const lastWindow = closedWindows?.[0] ?? null;

  // Fetch posts if there's an active window
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

  if (activeWindow) {
    // Fetch all top-level posts (including deleted — they show as [deleted post] if they have replies)
    const { data: topLevelPosts } = await supabase
      .from("posts")
      .select("*, profiles!inner(display_name)")
      .eq("forum_window_id", activeWindow.id)
      .is("parent_id", null)
      .order("created_at", { ascending: false });

    if (topLevelPosts) {
      // Get reply counts (only non-deleted replies)
      const { data: replyCounts } = await supabase
        .from("posts")
        .select("parent_id")
        .eq("forum_window_id", activeWindow.id)
        .not("parent_id", "is", null)
        .is("deleted_at", null);

      const replyCountMap = new Map<string, number>();
      (replyCounts ?? []).forEach((r) => {
        const count = replyCountMap.get(r.parent_id!) ?? 0;
        replyCountMap.set(r.parent_id!, count + 1);
      });

      // Filter out deleted posts with no replies
      posts = topLevelPosts
        .filter((p) => !p.deleted_at || (replyCountMap.get(p.id) ?? 0) > 0)
        .map((p) => ({
          ...p,
          author_name: (p.profiles as { display_name: string }).display_name,
          reply_count: replyCountMap.get(p.id) ?? 0,
        }));
    }
  }

  // Check auth status
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if user is admin for this county
  let isAdmin = false;
  if (user) {
    const { data: adminRecord } = await supabase
      .from("county_admins")
      .select("id")
      .eq("user_id", user.id)
      .eq("county_id", county.id)
      .single();
    isAdmin = !!adminRecord;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-100">
          {county.name} County
        </h1>
        {isAdmin && (
          <a
            href={`/county/${slug}/admin`}
            className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm text-neutral-900 hover:bg-neutral-300"
          >
            Admin
          </a>
        )}
      </div>

      <ForumStatus
        activeWindow={activeWindow}
        lastWindow={lastWindow}
      />

      {activeWindow ? (
        <>
          {user && (
            <div className="mb-4 space-y-4">
              {!isAdmin && <RateLimitIndicator userId={user.id} />}
              <NewPostForm
                forumWindowId={activeWindow.id}
                countySlug={slug}
              />
            </div>
          )}
          <PostList
            posts={posts}
            forumWindowId={activeWindow.id}
            countySlug={slug}
            isLoggedIn={!!user}
          />
        </>
      ) : (
        !lastWindow && (
          <p className="text-center text-neutral-400">
            No forum activity yet for this county.
          </p>
        )
      )}

      {closedWindows && closedWindows.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-3 text-lg font-medium text-neutral-100">
            Archived
          </h2>
          <div className="space-y-2">
            {closedWindows.map((w) => (
              <Link
                key={w.id}
                href={`/county/${slug}/forum/${w.id}`}
                className="flex items-center justify-between rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 hover:border-neutral-600"
              >
                <span className="text-sm text-neutral-200">
                  {w.hijri_month} {w.hijri_year} AH
                </span>
                <span
                  className={`text-xs ${
                    w.decision === "sighted"
                      ? "text-green-400"
                      : "text-neutral-500"
                  }`}
                >
                  {w.decision === "sighted" ? "Sighted" : "Not Sighted"}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
