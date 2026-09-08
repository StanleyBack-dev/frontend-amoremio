import { useState } from "react";
import { Calendar } from "lucide-react";
import Button from "@atoms/Button";
import {
  DATE_RANGE_PRESETS,
  dateToInputValue,
  inputValueToDate,
  type DateRangePreset,
} from "@/features/dashboard/model/date-presets";

interface DateRangeFilterProps {
  preset: DateRangePreset;
  from: Date;
  to: Date;
  onPresetChange: (preset: Exclude<DateRangePreset, "custom">) => void;
  onCustomApply: (range: { from: Date; to: Date }) => void;
}

// Single filter row, above every chart/stat on the dashboard — every one of
// them re-renders against the same period, so the numbers always agree.
// Presets read as one row of chips; "Personalizado" reveals two date
// inputs behind it rather than a calendar grid nobody needs for "last 30
// days".
export default function DateRangeFilter({
  preset,
  from,
  to,
  onPresetChange,
  onCustomApply,
}: DateRangeFilterProps) {
  const inclusiveTo = new Date(to.getTime() - 24 * 60 * 60 * 1000);
  const [customFrom, setCustomFrom] = useState(() => dateToInputValue(from));
  const [customTo, setCustomTo] = useState(() => dateToInputValue(inclusiveTo));

  function openCustom() {
    setCustomFrom(dateToInputValue(from));
    setCustomTo(dateToInputValue(inclusiveTo));
    onPresetChange("custom" as never);
  }

  function applyCustom() {
    if (!customFrom || !customTo) return;
    const nextFrom = inputValueToDate(customFrom);
    const nextTo = new Date(
      inputValueToDate(customTo).getTime() + 24 * 60 * 60 * 1000,
    );
    if (nextFrom.getTime() >= nextTo.getTime()) return;
    onCustomApply({ from: nextFrom, to: nextTo });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-hairline bg-card px-4 py-3 sm:px-5">
      <div className="flex flex-wrap items-center gap-2">
        <Calendar size={15} className="mr-1 shrink-0 text-ink-subtle" />
        {DATE_RANGE_PRESETS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => onPresetChange(option.key)}
            className={`rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
              preset === option.key
                ? "bg-brand text-white"
                : "bg-card-alt text-ink-muted hover:bg-hairline"
            }`}
          >
            {option.label}
          </button>
        ))}
        <button
          type="button"
          onClick={openCustom}
          className={`rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
            preset === "custom"
              ? "bg-brand text-white"
              : "bg-card-alt text-ink-muted hover:bg-hairline"
          }`}
        >
          Personalizado
        </button>
      </div>

      {preset === "custom" && (
        <div className="flex flex-wrap items-end gap-3 border-t border-hairline pt-3">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-subtle">
              De
            </span>
            <input
              type="date"
              value={customFrom}
              max={customTo || undefined}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="h-9 rounded-md border border-hairline-strong bg-field px-2.5 text-[13px] text-ink"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-subtle">
              Até
            </span>
            <input
              type="date"
              value={customTo}
              min={customFrom || undefined}
              onChange={(e) => setCustomTo(e.target.value)}
              className="h-9 rounded-md border border-hairline-strong bg-field px-2.5 text-[13px] text-ink"
            />
          </label>
          <Button
            variant="primary"
            size="sm"
            disabled={!customFrom || !customTo}
            onClick={applyCustom}
          >
            Aplicar
          </Button>
        </div>
      )}
    </div>
  );
}
