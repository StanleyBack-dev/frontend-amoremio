import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartTooltip from "./ChartTooltip";

export interface TopProductBar {
  idProduct: string;
  productName: string;
  revenue: number;
  quantitySold: number;
}

interface TopProductsBarChartProps {
  data: TopProductBar[];
}

const BAR_COLOR = "#93353D"; // brand
const BAR_COLOR_HOVER = "#7C2A31"; // brand-600

const brl = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);

function truncate(label: string, max = 22): string {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

export default function TopProductsBarChart({
  data,
}: TopProductsBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-[13px] text-ink-muted">
        Nenhuma venda confirmada no período.
      </div>
    );
  }

  // Recharts sizes a horizontal bar chart by row count; each row gets a
  // fixed band so five products and eight both stay readable.
  const height = Math.max(160, data.length * 34);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 4, right: 24, left: 0, bottom: 4 }}
        barCategoryGap={10}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="productName"
          tickFormatter={(value) => truncate(String(value))}
          tick={{ fontSize: 12, fill: "#33231F" }}
          axisLine={false}
          tickLine={false}
          width={140}
        />
        <Tooltip
          cursor={{ fill: "#FAF5EF" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const row = payload[0]?.payload as TopProductBar;
            return (
              <ChartTooltip
                title={row.productName}
                rows={[
                  {
                    key: "revenue",
                    label: "Receita",
                    value: brl(row.revenue),
                    color: BAR_COLOR,
                  },
                  {
                    key: "qty",
                    label: "Qtd. vendida",
                    value: new Intl.NumberFormat("pt-BR", {
                      maximumFractionDigits: 3,
                    }).format(row.quantitySold),
                    color: BAR_COLOR,
                  },
                ]}
              />
            );
          }}
        />
        <Bar dataKey="revenue" radius={[0, 4, 4, 0]} maxBarSize={24}>
          {data.map((row) => (
            <Cell
              key={row.idProduct}
              fill={BAR_COLOR}
              className="transition-colors"
              style={{ cursor: "pointer" }}
              onMouseEnter={(e) => {
                (e.target as SVGElement).setAttribute("fill", BAR_COLOR_HOVER);
              }}
              onMouseLeave={(e) => {
                (e.target as SVGElement).setAttribute("fill", BAR_COLOR);
              }}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
