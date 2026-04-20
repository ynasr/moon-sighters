"use client";

import { useEffect, useState, useCallback } from "react";
import { getRemainingLimits } from "@/app/county/[slug]/actions";

type Limits = {
  posts: { used: number; max: number };
  replies: { used: number; max: number };
  images: { used: number; max: number };
};

export function RateLimitIndicator({ userId }: { userId: string }) {
  const [limits, setLimits] = useState<Limits | null>(null);

  const refresh = useCallback(() => {
    getRemainingLimits().then(setLimits);
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener("post-created", refresh);
    return () => window.removeEventListener("post-created", refresh);
  }, [userId, refresh]);

  if (!limits) return null;

  return (
    <div className="flex items-center gap-4 text-xs text-neutral-500">
      <span className="text-neutral-400">per user daily limits</span>
      <span>
        posts: {limits.posts.used}/{limits.posts.max}
      </span>
      <span>
        replies: {limits.replies.used}/{limits.replies.max}
      </span>
      <span>
        images: {limits.images.used}/{limits.images.max}
      </span>
    </div>
  );
}
