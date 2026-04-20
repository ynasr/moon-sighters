"use client";

import { useState, useCallback } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
} from "react-simple-maps";
import { useRouter } from "next/navigation";

type CountyHeatData = {
  slug: string;
  name: string;
  postCount: number;
  status: "closed" | "open" | "sighted" | "not_sighted";
};

function getHeatColor(data: CountyHeatData | undefined): string {
  if (!data) return "#e5e5e5";

  switch (data.status) {
    case "sighted":
      return "#22c55e";
    case "not_sighted":
      return "#94a3b8";
    case "closed":
      return "#e5e5e5";
    case "open": {
      if (data.postCount === 0) return "#fef3c7";
      if (data.postCount <= 5) return "#fcd34d";
      if (data.postCount <= 15) return "#f97316";
      return "#ef4444";
    }
  }
}

const GEO_URL = "/data/socal-counties.json";

export function CountyMap({
  heatData,
}: {
  heatData: CountyHeatData[];
}) {
  const router = useRouter();
  const [hoveredCounty, setHoveredCounty] = useState<CountyHeatData | null>(
    null
  );
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      setTooltipPos({ x: e.clientX, y: e.clientY });
    },
    []
  );

  const statusLabel = (status: CountyHeatData["status"]) => {
    switch (status) {
      case "sighted":
        return "Moon Sighted";
      case "not_sighted":
        return "Not Sighted";
      case "open":
        return "Forum Open";
      case "closed":
        return "Forum Closed";
    }
  };

  return (
    <div className="relative" onMouseMove={handleMouseMove}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          center: [-116.8, 33.7],
          scale: 5500,
        }}
        width={800}
        height={450}
        style={{ width: "100%", height: "auto" }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const slug = geo.properties.slug as string;
              const data = heatData.find((d) => d.slug === slug);
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={getHeatColor(data)}
                  stroke="#262626"
                  strokeWidth={1.5}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none", opacity: 0.8, cursor: "pointer" },
                    pressed: { outline: "none" },
                  }}
                  onClick={() => router.push(`/county/${slug}`)}
                  onMouseEnter={() =>
                    setHoveredCounty(data ?? null)
                  }
                  onMouseLeave={() => setHoveredCounty(null)}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {hoveredCounty && (
        <div
          className="pointer-events-none fixed z-50 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 shadow-lg"
          style={{
            left: tooltipPos.x + 12,
            top: tooltipPos.y + 12,
          }}
        >
          <p className="font-medium text-neutral-100">
            {hoveredCounty.name}
          </p>
          <p className="text-sm text-neutral-400">
            {statusLabel(hoveredCounty.status)}
          </p>
          {hoveredCounty.status === "open" && (
            <p className="text-sm text-neutral-400">
              {hoveredCounty.postCount} post
              {hoveredCounty.postCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      )}

      <div className="mt-2 flex items-center justify-center gap-4 text-xs text-neutral-400">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-[#e5e5e5]" />
          Closed
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-[#fcd34d]" />
          Open
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-[#22c55e]" />
          Sighted
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-[#94a3b8]" />
          Not Sighted
        </span>
      </div>
    </div>
  );
}
