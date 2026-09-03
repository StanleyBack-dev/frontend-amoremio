import type { ReactNode } from "react";
import Button from "../atoms/Button";
import Input from "../atoms/Input";
import Select from "../atoms/Select";
import FilterPanel from "./FilterPanel";

interface FilterOption {
  value: string;
  label: string;
}

interface ListFiltersPanelProps {
  statusLabel?: string;
  statusValue: string;
  statusOptions: FilterOption[];
  onStatusChange: (value: string) => void;
  startDateValue: string;
  endDateValue: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onClear: () => void;
  extraFilters?: ReactNode;
  hasActiveFilters?: boolean;
}

export default function ListFiltersPanel({
  statusLabel = "Status",
  statusValue,
  statusOptions,
  onStatusChange,
  startDateValue,
  endDateValue,
  onStartDateChange,
  onEndDateChange,
  onClear,
  extraFilters,
  hasActiveFilters,
}: ListFiltersPanelProps) {
  const shouldEnableClear =
    hasActiveFilters ??
    (Boolean(statusValue) || Boolean(startDateValue) || Boolean(endDateValue));

  return (
    <FilterPanel hasActiveFilters={shouldEnableClear}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Select
          label={statusLabel}
          value={statusValue}
          onChange={(event) => onStatusChange(event.target.value)}
          wrapperClassName="xl:col-span-1"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Input
          label="Data inicial"
          type="date"
          value={startDateValue}
          onChange={(event) => onStartDateChange(event.target.value)}
          wrapperClassName="xl:col-span-1"
        />
        <Input
          label="Data final"
          type="date"
          value={endDateValue}
          onChange={(event) => onEndDateChange(event.target.value)}
          wrapperClassName="xl:col-span-1"
        />
        {extraFilters ? extraFilters : <div className="xl:col-span-1" />}
        <div className="flex items-end xl:col-span-1">
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={onClear}
            disabled={!shouldEnableClear}
          >
            Limpar filtros
          </Button>
        </div>
      </div>
    </FilterPanel>
  );
}
