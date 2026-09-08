const DAY_MS = 24 * 60 * 60 * 1000;

export type DateRangePreset =
  | "today"
  | "yesterday"
  | "last7"
  | "last30"
  | "thisMonth"
  | "lastMonth"
  | "thisYear"
  | "custom";

export const DATE_RANGE_PRESETS: {
  key: Exclude<DateRangePreset, "custom">;
  label: string;
}[] = [
  { key: "today", label: "Hoje" },
  { key: "yesterday", label: "Ontem" },
  { key: "last7", label: "Últimos 7 dias" },
  { key: "last30", label: "Últimos 30 dias" },
  { key: "thisMonth", label: "Este mês" },
  { key: "lastMonth", label: "Mês passado" },
  { key: "thisYear", label: "Este ano" },
];

function utcMidnight(year: number, monthIndex: number, day: number): Date {
  return new Date(Date.UTC(year, monthIndex, day, 0, 0, 0, 0));
}

// Anchors a browser-local calendar day to UTC midnight — the same
// date-only convention the backend uses for `date` columns, so a range
// picked here lands on the intended calendar day regardless of offset.
function startOfLocalDay(date: Date): Date {
  return utcMidnight(date.getFullYear(), date.getMonth(), date.getDate());
}

export function computePresetRange(
  preset: Exclude<DateRangePreset, "custom">,
  now: Date = new Date(),
): { from: Date; to: Date } {
  const todayStart = startOfLocalDay(now);
  const tomorrowStart = new Date(todayStart.getTime() + DAY_MS);

  switch (preset) {
    case "today":
      return { from: todayStart, to: tomorrowStart };
    case "yesterday":
      return { from: new Date(todayStart.getTime() - DAY_MS), to: todayStart };
    case "last7":
      return {
        from: new Date(todayStart.getTime() - 6 * DAY_MS),
        to: tomorrowStart,
      };
    case "last30":
      return {
        from: new Date(todayStart.getTime() - 29 * DAY_MS),
        to: tomorrowStart,
      };
    case "thisMonth":
      return {
        from: utcMidnight(now.getFullYear(), now.getMonth(), 1),
        to: tomorrowStart,
      };
    case "lastMonth":
      return {
        from: utcMidnight(now.getFullYear(), now.getMonth() - 1, 1),
        to: utcMidnight(now.getFullYear(), now.getMonth(), 1),
      };
    case "thisYear":
      return {
        from: utcMidnight(now.getFullYear(), 0, 1),
        to: tomorrowStart,
      };
  }
}

export function dateToInputValue(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function inputValueToDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return utcMidnight(year, month - 1, day);
}

export function formatRangeLabel(from: Date, to: Date): string {
  const inclusiveTo = new Date(to.getTime() - DAY_MS);
  const fmt = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });
  const fmtWithYear = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  if (from.getTime() === inclusiveTo.getTime()) {
    return fmtWithYear.format(from);
  }
  const sameYear = from.getUTCFullYear() === inclusiveTo.getUTCFullYear();
  return `${fmt.format(from)} – ${sameYear ? fmt.format(inclusiveTo) : fmtWithYear.format(inclusiveTo)}, ${inclusiveTo.getUTCFullYear()}`;
}
