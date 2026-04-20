"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Reply = {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
  deleted_at: string | null;
  author_name: string;
};

export function ReplyThread({
  postId,
  forumWindowId,
}: {
  postId: string;
  forumWindowId: string;
}) {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Fetch existing replies
    async function fetchReplies() {
      const { data } = await supabase
        .from("posts")
        .select("id, author_id, body, created_at, deleted_at, profiles!inner(display_name)")
        .eq("parent_id", postId)
        .order("created_at", { ascending: true });

      if (data) {
        setReplies(
          data.map((r) => ({
            id: r.id,
            author_id: r.author_id,
            body: r.body,
            created_at: r.created_at,
            deleted_at: r.deleted_at,
            author_name: (r.profiles as { display_name: string }).display_name,
          }))
        );
      }
      setLoading(false);
    }

    fetchReplies();

    // Subscribe to new replies
    const channel = supabase
      .channel(`replies-${postId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
          filter: `parent_id=eq.${postId}`,
        },
        async (payload) => {
          const newReply = payload.new as { id: string; author_id: string; body: string; created_at: string };

          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", newReply.author_id)
            .single();

          setReplies((prev) => {
            if (prev.some((r) => r.id === newReply.id)) return prev;
            return [
              ...prev,
              {
                ...newReply,
                author_name: profile?.display_name ?? "Unknown",
              },
            ];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, forumWindowId]);

  if (loading) {
    return <p className="text-sm text-neutral-400">Loading replies...</p>;
  }

  if (replies.length === 0) {
    return <p className="text-sm text-neutral-400">No replies yet.</p>;
  }

  return (
    <div className="space-y-2 border-l-2 border-neutral-700 pl-4">
      {replies.map((reply) => (
        <div key={reply.id} className="text-sm">
          {reply.deleted_at ? (
            <p className="italic text-neutral-500">[deleted reply]</p>
          ) : (
            <>
              <div className="flex items-center gap-2 text-neutral-500">
                <span className="font-medium text-neutral-400">
                  {reply.author_name}
                </span>
                <span>&middot;</span>
                <span>{getTimeAgo(reply.created_at)}</span>
              </div>
              <p className="mt-0.5 text-neutral-300 whitespace-pre-wrap">
                {reply.body}
              </p>
            </>
          )}
        </div>
      ))}
    </div>
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
