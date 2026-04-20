"use client";

import { getHijriParts, getGregorianDate } from "@/lib/utils/hijri";

export function HijriDateDisplay({
  sightedMonth,
  sightedYear,
}: {
  sightedMonth?: string | null;
  sightedYear?: number | null;
}) {
  const hijri = getHijriParts();
  const gregorian = getGregorianDate();

  const displayMonth = sightedMonth ?? hijri.month;
  const displayYear = sightedYear ? String(sightedYear) : hijri.year;

  return (
    <div className="text-center">
      <p className="text-3xl font-bold text-neutral-100">
        {displayMonth} {displayYear} AH
      </p>
      <p className="mt-1 text-sm text-neutral-400">{gregorian}</p>
    </div>
  );
}
