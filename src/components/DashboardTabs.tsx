"use client";

import { useState } from "react";
import { CountyMap } from "@/components/map/CountyMap";

type CountyHeatData = {
  slug: string;
  name: string;
  postCount: number;
  status: "closed" | "open" | "sighted" | "not_sighted";
};

type County = {
  id: string;
  name: string;
  slug: string;
};

export function DashboardTabs({
  heatData,
  counties,
}: {
  heatData: CountyHeatData[];
  counties: County[];
}) {
  const [tab, setTab] = useState<"map" | "list">("map");

  return (
    <div>
      <div className="mb-4 flex gap-1 rounded-lg bg-neutral-800 p-1">
        <button
          onClick={() => setTab("map")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "map"
              ? "bg-neutral-700 text-white"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          Map
        </button>
        <button
          onClick={() => setTab("list")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "list"
              ? "bg-neutral-700 text-white"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          List
        </button>
      </div>

      {tab === "map" ? (
        <div className="rounded-xl border border-neutral-700 bg-neutral-900 p-4">
          <CountyMap heatData={heatData} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {counties.map((county) => {
            const data = heatData.find((d) => d.slug === county.slug);
            return (
              <a
                key={county.id}
                href={`/county/${county.slug}`}
                className="rounded-lg border border-neutral-700 p-4 transition-colors hover:border-neutral-500"
              >
                <h3 className="font-medium text-neutral-100">{county.name}</h3>
                <p className="mt-1 text-sm text-neutral-400">
                  {data?.status === "open"
                    ? `Forum open — ${data.postCount} post${data.postCount !== 1 ? "s" : ""}`
                    : data?.status === "sighted"
                      ? "Moon sighted"
                      : data?.status === "not_sighted"
                        ? "Not sighted"
                        : "Forum closed"}
                </p>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
