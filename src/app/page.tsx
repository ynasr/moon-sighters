import { createClient } from "@/lib/supabase/server";
import { HijriDateDisplay } from "@/components/HijriDateDisplay";
import { DashboardTabs } from "@/components/DashboardTabs";

export default async function HomePage() {
  const supabase = await createClient();

  const { data: counties } = await supabase
    .from("counties")
    .select("id, name, slug");

  const { data: activeWindows } = await supabase
    .from("forum_windows")
    .select("id, county_id, decision, closed_at, hijri_month, hijri_year");

  const { data: postCounts } = await supabase
    .from("posts")
    .select("forum_window_id")
    .is("deleted_at", null);

  // Build heat map data
  const heatData = (counties ?? []).map((county) => {
    const windows = (activeWindows ?? [])
      .filter((w) => w.county_id === county.id)
      .sort(
        (a, b) =>
          new Date(b.closed_at ?? "9999").getTime() -
          new Date(a.closed_at ?? "9999").getTime()
      );

    const activeWindow = windows.find((w) => !w.closed_at);
    const latestWindow = windows[0];

    let status: "closed" | "open" | "sighted" | "not_sighted" = "closed";
    let postCount = 0;

    if (activeWindow) {
      status = "open";
      postCount = (postCounts ?? []).filter(
        (p) => p.forum_window_id === activeWindow.id
      ).length;
    } else if (latestWindow?.decision === "sighted") {
      status = "sighted";
    } else if (latestWindow?.decision === "not_sighted") {
      status = "not_sighted";
    }

    return {
      slug: county.slug,
      name: county.name,
      postCount,
      status,
    };
  });

  // Check if any county has a "sighted" decision on its latest closed window
  const sightedWindow = (activeWindows ?? []).find(
    (w) => w.closed_at && w.decision === "sighted"
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <HijriDateDisplay
          sightedMonth={sightedWindow?.hijri_month ?? null}
          sightedYear={sightedWindow?.hijri_year ?? null}
        />
      </div>

      <h2 className="mb-4 flex items-center justify-center gap-2 text-center text-lg font-medium text-neutral-300">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-purple-500" />
        </span>
        Beta: Southern California only
      </h2>

      <DashboardTabs heatData={heatData} counties={counties ?? []} />
    </div>
  );
}
