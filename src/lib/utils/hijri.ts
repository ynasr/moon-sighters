export function getHijriDate(date: Date = new Date()): string {
  return date.toLocaleDateString("en-US", {
    calendar: "islamic-umalqura",
    year: "numeric",
    month: "long",
    day: "numeric",
  } as Intl.DateTimeFormatOptions);
}

export function getHijriParts(date: Date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    calendar: "islamic-umalqura",
    year: "numeric",
    month: "long",
    day: "numeric",
  } as Intl.DateTimeFormatOptions);

  const parts = formatter.formatToParts(date);
  return {
    day: parts.find((p) => p.type === "day")?.value ?? "",
    month: parts.find((p) => p.type === "month")?.value ?? "",
    year: parts.find((p) => p.type === "year")?.value ?? "",
  };
}

export function getGregorianDate(date: Date = new Date()): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
