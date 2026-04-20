"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { openForumWindow, closeForumWindow, deletePost } from "./actions";

type ForumWindow = {
  id: string;
  hijri_month: string;
  hijri_year: number;
  closed_at: string | null;
  decision: string | null;
};

type Post = {
  id: string;
  body: string;
  image_url: string | null;
  created_at: string;
  deleted_at: string | null;
  author_name: string;
  parent_id: string | null;
};

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.519.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
    </svg>
  );
}

function getTimeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

export default function AdminPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [activeWindow, setActiveWindow] = useState<ForumWindow | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [countyName, setCountyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state for opening a window
  const [hijriMonth, setHijriMonth] = useState("");
  const [hijriYear, setHijriYear] = useState("");

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      const { data: county } = await supabase
        .from("counties")
        .select("id, name")
        .eq("slug", slug)
        .single();

      if (!county) return;
      setCountyName(county.name);

      const { data: window } = await supabase
        .from("forum_windows")
        .select("*")
        .eq("county_id", county.id)
        .is("closed_at", null)
        .single();

      setActiveWindow(window);

      if (window) {
        const { data: allPosts } = await supabase
          .from("posts")
          .select("id, body, image_url, created_at, deleted_at, parent_id, profiles!inner(display_name)")
          .eq("forum_window_id", window.id)
          .order("created_at", { ascending: false });

        if (allPosts) {
          setPosts(
            allPosts.map((p) => ({
              id: p.id,
              body: p.body,
              image_url: p.image_url,
              created_at: p.created_at,
              deleted_at: p.deleted_at,
              parent_id: p.parent_id,
              author_name: (p.profiles as { display_name: string }).display_name,
            }))
          );
        }
      }

      setLoading(false);
    }

    fetchData();
  }, [slug]);

  async function handleOpenForum(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.set("countySlug", slug);
    formData.set("hijriMonth", hijriMonth);
    formData.set("hijriYear", hijriYear);

    const result = await openForumWindow(formData);
    if (result.error) {
      setError(result.error);
    } else {
      router.refresh();
      window.location.reload();
    }
  }

  async function handleCloseForum(decision: "sighted" | "not_sighted") {
    if (!activeWindow) return;
    setError(null);

    const confirmMsg =
      decision === "sighted"
        ? "Confirm: The moon has been sighted and the new month begins?"
        : "Confirm: The moon was not sighted and the current month continues?";

    if (!confirm(confirmMsg)) return;

    const formData = new FormData();
    formData.set("countySlug", slug);
    formData.set("windowId", activeWindow.id);
    formData.set("decision", decision);

    const result = await closeForumWindow(formData);
    if (result.error) {
      setError(result.error);
    } else {
      router.refresh();
      window.location.reload();
    }
  }

  async function handleDeletePost(postId: string) {
    if (!confirm("Delete this post?")) return;

    const formData = new FormData();
    formData.set("countySlug", slug);
    formData.set("postId", postId);

    const result = await deletePost(formData);
    if (result.error) {
      setError(result.error);
    } else {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, deleted_at: new Date().toISOString() } : p
        )
      );
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-neutral-400">Loading...</p>
      </div>
    );
  }

  const hijriMonths = [
    "Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani",
    "Jumada al-Ula", "Jumada al-Thani", "Rajab", "Shaban",
    "Ramadan", "Shawwal", "Dhul Qadah", "Dhul Hijjah",
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-100">
          {countyName} — Admin
        </h1>
        <a
          href={`/county/${slug}`}
          className="text-sm text-neutral-400 hover:text-neutral-200"
        >
          Back to forum
        </a>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-700/50 bg-red-900/20 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {!activeWindow ? (
        <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-6">
          <h2 className="mb-4 text-lg font-medium text-neutral-100">
            Open Forum Window
          </h2>
          <form onSubmit={handleOpenForum} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300">
                Hijri Month
              </label>
              <select
                value={hijriMonth}
                onChange={(e) => setHijriMonth(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-200 focus:border-neutral-500 focus:outline-none"
              >
                <option value="">Select month...</option>
                {hijriMonths.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300">
                Hijri Year
              </label>
              <input
                type="number"
                value={hijriYear}
                onChange={(e) => setHijriYear(e.target.value)}
                placeholder="e.g. 1447"
                required
                className="mt-1 block w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-200 placeholder-neutral-500 focus:border-neutral-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-300"
            >
              Open Forum
            </button>
          </form>
        </div>
      ) : (
        <>
          <div className="mb-6 rounded-lg border border-amber-700/50 bg-amber-900/20 p-4">
            <p className="font-medium text-amber-200">
              Forum is open: {activeWindow.hijri_month}{" "}
              {activeWindow.hijri_year} AH
            </p>
            <div className="mt-3 flex gap-3">
              <button
                onClick={() => handleCloseForum("sighted")}
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Moon Sighted
              </button>
              <button
                onClick={() => handleCloseForum("not_sighted")}
                className="rounded-md bg-neutral-600 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
              >
                Not Sighted
              </button>
            </div>
          </div>

          <div>
            {(() => {
              const topPosts = posts.filter((p) => !p.parent_id);
              const replies = posts.filter((p) => p.parent_id);
              const topPostCount = topPosts.filter((p) => !p.deleted_at).length;

              return (
                <>
                  <h2 className="mb-3 text-lg font-medium text-neutral-100">
                    Posts ({topPostCount})
                  </h2>
                  {topPosts.length === 0 ? (
                    <p className="text-neutral-400">No posts yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {topPosts.map((post) => {
                        const postReplies = replies.filter(
                          (r) => r.parent_id === post.id
                        );
                        const isDeleted = !!post.deleted_at;

                        // Hide deleted posts with no replies
                        if (isDeleted && postReplies.length === 0) return null;

                        return (
                          <div
                            key={post.id}
                            className="rounded-lg border border-neutral-700 bg-neutral-900 p-4"
                          >
                            {isDeleted ? (
                              <p className="text-sm italic text-neutral-500">
                                [deleted post]
                              </p>
                            ) : (
                              <>
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-2 text-sm text-neutral-500">
                                    <span className="font-medium text-neutral-300">
                                      {post.author_name}
                                    </span>
                                    <span>&middot;</span>
                                    <span>{getTimeAgo(post.created_at)}</span>
                                  </div>
                                  <button
                                    onClick={() => handleDeletePost(post.id)}
                                    className="text-neutral-500 hover:text-red-400"
                                    title="Delete post"
                                  >
                                    <TrashIcon />
                                  </button>
                                </div>
                                <p className="mt-2 text-sm text-neutral-200 whitespace-pre-wrap">
                                  {post.body}
                                </p>
                                {post.image_url && (
                                  <img
                                    src={post.image_url}
                                    alt="Moon sighting"
                                    className="mt-3 max-h-80 rounded-md object-cover"
                                  />
                                )}
                              </>
                            )}

                            {postReplies.length > 0 && (
                              <div className="mt-3 space-y-2 border-l-2 border-neutral-700 pl-4">
                                {postReplies.map((reply) => (
                                  <div key={reply.id} className="text-sm">
                                    {reply.deleted_at ? (
                                      <p className="italic text-neutral-500">
                                        [deleted reply]
                                      </p>
                                    ) : (
                                      <>
                                        <div className="flex items-start justify-between">
                                          <div className="flex items-center gap-2 text-neutral-500">
                                            <span className="font-medium text-neutral-400">
                                              {reply.author_name}
                                            </span>
                                            <span>&middot;</span>
                                            <span>
                                              {getTimeAgo(reply.created_at)}
                                            </span>
                                          </div>
                                          <button
                                            onClick={() =>
                                              handleDeletePost(reply.id)
                                            }
                                            className="text-neutral-500 hover:text-red-400"
                                            title="Delete reply"
                                          >
                                            <TrashIcon />
                                          </button>
                                        </div>
                                        <p className="mt-0.5 text-neutral-300 whitespace-pre-wrap">
                                          {reply.body}
                                        </p>
                                      </>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
}
