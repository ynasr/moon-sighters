"use client";

import { useState } from "react";
import { ReplyThread } from "./ReplyThread";
import { NewReplyForm } from "./NewReplyForm";

type Post = {
  id: string;
  forum_window_id: string;
  author_id: string;
  body: string;
  image_url: string | null;
  created_at: string;
  deleted_at: string | null;
  author_name: string;
  reply_count: number;
};

export function PostCard({
  post,
  countySlug,
  isLoggedIn,
}: {
  post: Post;
  countySlug: string;
  isLoggedIn: boolean;
}) {
  const [showReplies, setShowReplies] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);

  const timeAgo = getTimeAgo(post.created_at);
  const isDeleted = !!post.deleted_at;

  return (
    <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
      {isDeleted ? (
        <p className="text-sm italic text-neutral-500">[deleted post]</p>
      ) : (
        <>
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <span className="font-medium text-neutral-300">
              {post.author_name}
            </span>
            <span>&middot;</span>
            <span>{timeAgo}</span>
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

      <div className="mt-3 flex items-center gap-4 text-sm text-neutral-500">
        {post.reply_count > 0 && (
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="hover:text-neutral-300"
          >
            {showReplies ? "Hide" : "Show"} {post.reply_count} repl
            {post.reply_count === 1 ? "y" : "ies"}
          </button>
        )}
        {isLoggedIn && !isDeleted && (
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="hover:text-neutral-300"
          >
            Reply
          </button>
        )}
      </div>

      {showReplies && (
        <div className="mt-3">
          <ReplyThread
            postId={post.id}
            forumWindowId={post.forum_window_id}
          />
        </div>
      )}

      {showReplyForm && (
        <div className="mt-3">
          <NewReplyForm
            parentId={post.id}
            forumWindowId={post.forum_window_id}
            countySlug={countySlug}
            onSubmitted={() => {
              setShowReplyForm(false);
              setShowReplies(true);
            }}
          />
        </div>
      )}
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
