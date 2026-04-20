import type { Database } from "@/lib/types/database";

type ForumWindow = Database["public"]["Tables"]["forum_windows"]["Row"];

export function ForumStatus({
  activeWindow,
  lastWindow,
}: {
  activeWindow: ForumWindow | null;
  lastWindow: ForumWindow | null;
}) {
  if (activeWindow) {
    return (
      <div className="mb-6 rounded-lg border border-amber-700/50 bg-amber-900/20 p-4">
        <p className="font-medium text-amber-200">
          Forum is open for {activeWindow.hijri_month}{" "}
          {activeWindow.hijri_year} AH
        </p>
        <p className="mt-1 text-sm text-amber-300/70">
          Share your moon sighting observations and discuss with the community.
        </p>
      </div>
    );
  }

  if (lastWindow) {
    const isSighted = lastWindow.decision === "sighted";
    return (
      <div
        className={`mb-6 rounded-lg border p-4 ${
          isSighted
            ? "border-green-700/50 bg-green-900/20"
            : "border-neutral-700 bg-neutral-800"
        }`}
      >
        <p
          className={`font-medium ${
            isSighted ? "text-green-200" : "text-neutral-200"
          }`}
        >
          {lastWindow.hijri_month} {lastWindow.hijri_year} AH —{" "}
          {isSighted ? "Moon Sighted" : "Not Sighted"}
        </p>
        <p
          className={`mt-1 text-sm ${
            isSighted ? "text-green-300/70" : "text-neutral-400"
          }`}
        >
          Forum is currently closed. It will reopen when the next month
          approaches.
        </p>
      </div>
    );
  }

  return null;
}
