"use client";

import { useState } from "react";
import { createPost, getSignedUploadUrl, getPublicImageUrl } from "@/app/county/[slug]/actions";
import { ImageUpload } from "./ImageUpload";

export function NewPostForm({
  forumWindowId,
  countySlug,
}: {
  forumWindowId: string;
  countySlug: string;
}) {
  const [body, setBody] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;

    setError(null);
    setLoading(true);

    let imageUrl: string | null = null;

    // Upload image if present
    if (imageFile) {
      const { url, path, error: uploadError } = await getSignedUploadUrl(
        imageFile.name
      );

      if (uploadError || !url || !path) {
        setError(uploadError ?? "Failed to get upload URL");
        setLoading(false);
        return;
      }

      const uploadRes = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": imageFile.type },
        body: imageFile,
      });

      if (!uploadRes.ok) {
        setError("Failed to upload image");
        setLoading(false);
        return;
      }

      imageUrl = await getPublicImageUrl(path);
    }

    const formData = new FormData();
    formData.set("body", body);
    formData.set("forumWindowId", forumWindowId);
    formData.set("countySlug", countySlug);
    if (imageUrl) formData.set("imageUrl", imageUrl);

    const result = await createPost(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setBody("");
    setImageFile(null);
    setLoading(false);
    window.dispatchEvent(new Event("post-created"));
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-neutral-700 bg-neutral-900 p-4"
    >
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share your moon sighting observation..."
        maxLength={10000}
        rows={3}
        className="w-full resize-none rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-200 placeholder-neutral-500 focus:border-neutral-500 focus:outline-none"
      />

      <ImageUpload
        onFileSelect={setImageFile}
        selectedFile={imageFile}
      />

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-neutral-500">
          {body.length.toLocaleString()}/10,000
        </span>
        <button
          type="submit"
          disabled={loading || !body.trim()}
          className="rounded-md bg-neutral-100 px-4 py-1.5 text-sm font-medium text-neutral-900 hover:bg-neutral-300 disabled:opacity-50"
        >
          {loading ? "Posting..." : "Post"}
        </button>
      </div>
    </form>
  );
}
