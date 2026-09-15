import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartTooltip from "./ChartTooltip";

export interface ComparisonBar {
  key: string;
  label: string;
  value: number;
  color: string;
}

interface CostComparisonBarChartProps {
  data: ComparisonBar[];
}

const brl = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

// Fixed-category horizontal bar (Compras / Produção / Vendas / Brindes…) —
// same shape as TopProductsBarChart but each bar keeps its own color
// instead of sharing one, since the categories aren't ranked, just compared.
export default function CostComparisonBarChart({
  data,
}: CostComparisonBarChartProps) {
  const height = Math.max(160, data.length * 44);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 4, right: 72, left: 0, bottom: 4 }}
        barCategoryGap={14}
      >
        {/* 20% headroom so the value label past the longest bar never clips. */}
        <XAxis
          type="number"
          hide
          domain={[0, (dataMax: number) => dataMax * 1.2]}
        />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fontSize: 12, fill: "#33231F" }}
          axisLine={false}
          tickLine={false}
          width={140}
        />
        <Tooltip
          cursor={{ fill: "#FAF5EF" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const row = payload[0]?.payload as ComparisonBar;
            return (
              <ChartTooltip
                title={row.label}
                rows={[
                  {
                    key: row.key,
                    label: row.label,
                    value: brl(row.value),
                    color: row.color,
                  },
                ]}
              />
            );
          }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={28}>
          {data.map((row) => (
            <Cell key={row.key} fill={row.color} />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            formatter={(value) => brl(Number(value ?? 0))}
            style={{ fontSize: 11, fontWeight: 600, fill: "#33231F" }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
