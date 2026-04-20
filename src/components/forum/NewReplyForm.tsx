"use client";

import { useState } from "react";
import { createReply } from "@/app/county/[slug]/actions";

export function NewReplyForm({
  parentId,
  forumWindowId,
  countySlug,
  onSubmitted,
}: {
  parentId: string;
  forumWindowId: string;
  countySlug: string;
  onSubmitted: () => void;
}) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;

    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.set("body", body);
    formData.set("parentId", parentId);
    formData.set("forumWindowId", forumWindowId);
    formData.set("countySlug", countySlug);

    const result = await createReply(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setBody("");
    setLoading(false);
    window.dispatchEvent(new Event("post-created"));
    onSubmitted();
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write a reply..."
        maxLength={10000}
        className="flex-1 rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-200 placeholder-neutral-500 focus:border-neutral-500 focus:outline-none"
      />
      <button
        type="submit"
        disabled={loading || !body.trim()}
        className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm text-neutral-900 hover:bg-neutral-300 disabled:opacity-50"
      >
        {loading ? "..." : "Reply"}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </form>
  );
}
