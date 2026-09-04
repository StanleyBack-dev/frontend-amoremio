import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import ChartTooltip from "./ChartTooltip";

export interface ChannelMixRow {
  channel: string;
  grossSales: number;
}

interface ChannelMixDonutProps {
  data: ChannelMixRow[];
  channelLabel: Record<string, string>;
}

// Validated categorical order (see dataviz skill) — the first four slots
// clear every CVD/contrast gate together; a 6th+ channel never gets a new
// hue, it folds into the neutral "Outros" slot instead.
const SLOT_COLORS = ["#2A78D6", "#EB6834", "#1BAF7A", "#EDA100"];
const OTHER_COLOR = "#9C877E";

const brl = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);

export default function ChannelMixDonut({
  data,
  channelLabel,
}: ChannelMixDonutProps) {
  const sorted = [...data]
    .filter((row) => row.grossSales > 0)
    .sort((a, b) => b.grossSales - a.grossSales);

  if (sorted.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-[13px] text-ink-muted">
        Nenhuma venda confirmada no período.
      </div>
    );
  }

  const head = sorted.slice(0, 4);
  const tail = sorted.slice(4);
  const otherTotal = tail.reduce((sum, row) => sum + row.grossSales, 0);

  const slices = head.map((row, index) => ({
    key: row.channel,
    label: channelLabel[row.channel] ?? row.channel,
    value: row.grossSales,
    color: SLOT_COLORS[index],
  }));
  if (otherTotal > 0) {
    slices.push({
      key: "OUTROS",
      label: `Outros (${tail.length})`,
      value: otherTotal,
      color: OTHER_COLOR,
    });
  }

  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <ResponsiveContainer
        width="100%"
        height={180}
        className="sm:max-w-[180px]"
      >
        <PieChart>
          <Pie
            data={slices}
            dataKey="value"
            nameKey="label"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            stroke="#FFFFFF"
            strokeWidth={2}
          >
            {slices.map((slice) => (
              <Cell key={slice.key} fill={slice.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const slice = payload[0]?.payload as (typeof slices)[number];
              return (
                <ChartTooltip
                  rows={[
                    {
                      key: slice.key,
                      label: slice.label,
                      value: `${brl(slice.value)} (${((slice.value / total) * 100).toFixed(0)}%)`,
                      color: slice.color,
                    },
                  ]}
                />
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <ul className="flex flex-1 flex-col gap-1.5">
        {slices.map((slice) => (
          <li
            key={slice.key}
            className="flex items-center justify-between gap-3 text-[12.5px]"
          >
            <span className="flex min-w-0 items-center gap-2 text-ink-muted">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: slice.color }}
                aria-hidden="true"
              />
              <span className="truncate">{slice.label}</span>
            </span>
            <span className="shrink-0 font-semibold text-ink tabular-nums">
              {brl(slice.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
