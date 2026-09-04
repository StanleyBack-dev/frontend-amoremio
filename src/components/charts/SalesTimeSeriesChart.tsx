import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartTooltip from "./ChartTooltip";

export interface TimeSeriesPoint {
  date: string; // YYYY-MM-DD bucket start
  sales: number;
  purchases: number;
}

export type ChartGranularity = "DAY" | "WEEK" | "MONTH";

interface SalesTimeSeriesChartProps {
  data: TimeSeriesPoint[];
  granularity: ChartGranularity;
}

const SALES_COLOR = "#93353D"; // brand
const PURCHASES_COLOR = "#B98C42"; // gold

const brl = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);

function parseBucketDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatAxisLabel(value: string, granularity: ChartGranularity) {
  const date = parseBucketDate(value);
  if (granularity === "MONTH") {
    return new Intl.DateTimeFormat("pt-BR", {
      month: "short",
      year: "2-digit",
      timeZone: "UTC",
    }).format(date);
  }
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

function formatTooltipTitle(value: string, granularity: ChartGranularity) {
  const date = parseBucketDate(value);
  const dayLabel = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
  if (granularity === "WEEK") return `Semana de ${dayLabel}`;
  if (granularity === "MONTH") {
    return new Intl.DateTimeFormat("pt-BR", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);
  }
  return dayLabel;
}

export default function SalesTimeSeriesChart({
  data,
  granularity,
}: SalesTimeSeriesChartProps) {
  const isEmpty = data.every(
    (point) => point.sales === 0 && point.purchases === 0,
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4 text-[12.5px] text-ink-muted">
        <span className="flex items-center gap-1.5">
          <span
            className="h-[2px] w-4 rounded-full"
            style={{ backgroundColor: SALES_COLOR }}
          />
          Vendas
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="h-[2px] w-4 rounded-full"
            style={{ backgroundColor: PURCHASES_COLOR }}
          />
          Compras
        </span>
      </div>

      {isEmpty ? (
        <div className="flex h-[260px] items-center justify-center text-[13px] text-ink-muted">
          Sem movimentação no período.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SALES_COLOR} stopOpacity={0.12} />
                <stop offset="100%" stopColor={SALES_COLOR} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="purchasesFill" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={PURCHASES_COLOR}
                  stopOpacity={0.12}
                />
                <stop
                  offset="100%"
                  stopColor={PURCHASES_COLOR}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#E7DDD2" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => formatAxisLabel(value, granularity)}
              tick={{ fontSize: 11, fill: "#9C877E" }}
              axisLine={{ stroke: "#E7DDD2" }}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis
              tickFormatter={(value) => brl(Number(value))}
              tick={{ fontSize: 11, fill: "#9C877E" }}
              axisLine={false}
              tickLine={false}
              width={72}
            />
            <Tooltip
              cursor={{ stroke: "#D8CABB", strokeWidth: 1 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <ChartTooltip
                    title={formatTooltipTitle(String(label), granularity)}
                    rows={[
                      {
                        key: "sales",
                        label: "Vendas",
                        value: brl(Number(payload[0]?.payload.sales ?? 0)),
                        color: SALES_COLOR,
                      },
                      {
                        key: "purchases",
                        label: "Compras",
                        value: brl(Number(payload[0]?.payload.purchases ?? 0)),
                        color: PURCHASES_COLOR,
                      },
                    ]}
                  />
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="sales"
              stroke={SALES_COLOR}
              strokeWidth={2}
              fill="url(#salesFill)"
              dot={false}
              activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="purchases"
              stroke={PURCHASES_COLOR}
              strokeWidth={2}
              fill="url(#purchasesFill)"
              dot={false}
              activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
