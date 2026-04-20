"use client";

import { useRef } from "react";

export function ImageUpload({
  onFileSelect,
  selectedFile,
}: {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > 25 * 1024 * 1024) {
      alert("Image must be under 25MB");
      return;
    }
    onFileSelect(file);
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="text-sm text-neutral-500 hover:text-neutral-300"
      >
        {selectedFile ? "Change image" : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 0 1 3.25 3h13.5A2.25 2.25 0 0 1 19 5.25v9.5A2.25 2.25 0 0 1 16.75 17H3.25A2.25 2.25 0 0 1 1 14.75v-9.5Zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 0 0 .75-.75v-2.69l-2.22-2.219a.75.75 0 0 0-1.06 0l-1.91 1.909-4.97-4.969a.75.75 0 0 0-1.06 0L2.5 11.06Zm10-3.81a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" clipRule="evenodd" /></svg>}
      </button>
      {selectedFile && (
        <>
          <span className="text-xs text-neutral-400">
            {selectedFile.name}
          </span>
          <button
            type="button"
            onClick={() => {
              onFileSelect(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="text-xs text-red-400 hover:text-red-300"
          >
            Remove
          </button>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
