"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PostCard } from "./PostCard";

type Post = {
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
};

export function PostList({
  posts: initialPosts,
  forumWindowId,
  countySlug,
  isLoggedIn,
}: {
  posts: Post[];
  forumWindowId: string;
  countySlug: string;
  isLoggedIn: boolean;
}) {
  const [posts, setPosts] = useState(initialPosts);

  // Subscribe to Realtime for new posts
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`forum-${forumWindowId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
          filter: `forum_window_id=eq.${forumWindowId}`,
        },
        async (payload) => {
          const newPost = payload.new as Post;

          // Only add top-level posts to the list
          if (newPost.parent_id) return;

          // Fetch the author's display name
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", newPost.author_id)
            .single();

          setPosts((prev) => {
            // Avoid duplicates
            if (prev.some((p) => p.id === newPost.id)) return prev;
            return [
              {
                ...newPost,
                author_name: profile?.display_name ?? "Unknown",
                reply_count: 0,
              },
              ...prev,
            ];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [forumWindowId]);

  // Sync with server-rendered data when it changes
  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  if (posts.length === 0) {
    return (
      <p className="py-8 text-center text-neutral-400">
        No posts yet. Be the first to share your observation.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          countySlug={countySlug}
          isLoggedIn={isLoggedIn}
        />
      ))}
    </div>
  );
}
