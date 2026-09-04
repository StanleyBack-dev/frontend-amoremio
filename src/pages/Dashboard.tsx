import { useCallback, useEffect, useMemo, useState } from "react";
import StatCard from "@molecules/StatCard";
import SectionCard from "@/components/organisms/SectionCard";
import DataTable from "@/components/organisms/DataTable";
import DateRangeFilter from "@molecules/DateRangeFilter";
import SalesTimeSeriesChart from "@/components/charts/SalesTimeSeriesChart";
import TopProductsBarChart from "@/components/charts/TopProductsBarChart";
import ChannelMixDonut from "@/components/charts/ChannelMixDonut";
import { useToast } from "@/shared/toast/useToast";
import { useStoreContext } from "@/features/stores";
import { fetchFinanceDashboard } from "@/features/dashboard";
import {
  computePresetRange,
  formatRangeLabel,
  type DateRangePreset,
} from "@/features/dashboard/model/date-presets";
import type { FinanceDashboard } from "@/api/dashboard/schema";

const brl = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const qty = (value: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(value);

const channelLabel: Record<string, string> = {
  BALCAO: "Balcão",
  IFOOD: "iFood",
  RAPPI: "Rappi",
  FOOD_99: "99Food",
  UBER_EATS: "Uber Eats",
  AIQFOME: "aiqfome",
  WHATSAPP: "WhatsApp",
  TELEFONE: "Telefone",
  OUTRO: "Outro",
};

const DEFAULT_PRESET = "last30" as const;

export default function Dashboard() {
  const { showError } = useToast();
  const { activeStoreId } = useStoreContext();
  const [data, setData] = useState<FinanceDashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [preset, setPreset] = useState<DateRangePreset>(DEFAULT_PRESET);
  const [range, setRange] = useState(() => computePresetRange(DEFAULT_PRESET));

  const rangeLabel = useMemo(
    () => formatRangeLabel(range.from, range.to),
    [range],
  );

  const load = useCallback(async () => {
    if (!activeStoreId) {
      setData(null);
      return;
    }
    setLoading(true);
    try {
      setData(await fetchFinanceDashboard(activeStoreId, range));
    } catch (error) {
      showError(
        "Erro ao carregar dashboard",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }, [activeStoreId, range, showError]);

  useEffect(() => {
    void load();
  }, [load]);

  // `onPresetChange` also fires with "custom" when the picker is opened —
  // only recompute the range for the real presets.
  function handlePresetChange(next: DateRangePreset) {
    setPreset(next);
    if (next !== "custom") {
      setRange(computePresetRange(next));
    }
  }

  function handleCustomApply(next: { from: Date; to: Date }) {
    setPreset("custom");
    setRange(next);
  }

  if (!activeStoreId) {
    return (
      <div className="flex flex-col gap-6">
        <SectionCard title="Nenhuma loja ativa">
          <p className="text-[13px] text-ink-muted">
            Selecione uma loja em <strong className="text-ink">Lojas</strong>{" "}
            para ver o painel.
          </p>
        </SectionCard>
      </div>
    );
  }

  const totals = data?.totals;
  const emptyMessage = loading
    ? "Carregando..."
    : "Nenhuma venda confirmada no período.";

  return (
    <div className="flex flex-col gap-6">
      <DateRangeFilter
        preset={preset}
        from={range.from}
        to={range.to}
        onPresetChange={handlePresetChange}
        onCustomApply={handleCustomApply}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Vendas"
          value={brl(totals?.totalSales ?? 0)}
          sub={`${totals?.salesCount ?? 0} venda(s) • líq. ${brl(
            totals?.netSales ?? 0,
          )}`}
        />
        <StatCard
          label="Comissões de canal"
          value={brl(totals?.totalCommission ?? 0)}
          sub="iFood, Rappi, etc. no período"
        />
        <StatCard
          label="Compras"
          value={brl(totals?.totalPurchases ?? 0)}
          sub={`${totals?.purchaseCount ?? 0} compra(s)`}
        />
        <StatCard
          label="Margem"
          value={brl(totals?.grossMargin ?? 0)}
          sub={`${(totals?.grossMarginPercent ?? 0).toFixed(
            1,
          )}% • líq. de comissão • CMV ${brl(totals?.costOfGoodsSold ?? 0)}`}
        />
        <StatCard
          label="Valor em estoque"
          value={brl(data?.stockValue ?? 0)}
          sub="custo médio × saldo"
        />
      </div>

      <SectionCard title="Compras × vendas" description={rangeLabel}>
        <SalesTimeSeriesChart
          data={data?.timeSeries ?? []}
          granularity={data?.granularity ?? "DAY"}
        />
      </SectionCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="Top produtos por receita" description={rangeLabel}>
          <TopProductsBarChart data={data?.topProducts ?? []} />
        </SectionCard>

        <SectionCard title="Mix de canais" description={rangeLabel}>
          <ChannelMixDonut
            data={data?.salesByChannel ?? []}
            channelLabel={channelLabel}
          />
        </SectionCard>
      </div>

      <SectionCard title="Lucro por produto" description={rangeLabel}>
        <DataTable
          data={data?.productProfitability ?? []}
          getId={(row) => row.idProduct}
          emptyMessage={emptyMessage}
          columns={[
            { key: "productName", label: "Produto" },
            {
              key: "quantitySold",
              label: "Qtd.",
              className: "text-right tabular-nums",
              render: (row) => qty(row.quantitySold),
            },
            {
              key: "revenue",
              label: "Receita",
              className: "text-right tabular-nums",
              render: (row) => brl(row.revenue),
            },
            {
              key: "cost",
              label: "Custo (ingred.)",
              className: "text-right tabular-nums",
              render: (row) => brl(row.cost),
            },
            {
              key: "commission",
              label: "Comissão",
              className: "text-right tabular-nums",
              render: (row) => brl(row.commission),
            },
            {
              key: "netProfit",
              label: "Lucro líquido",
              className: "text-right tabular-nums font-semibold",
              render: (row) => (
                <span
                  className={row.netProfit < 0 ? "text-err-fg" : "text-ok-fg"}
                >
                  {brl(row.netProfit)}
                </span>
              ),
            },
            {
              key: "marginPercent",
              label: "Margem",
              className: "text-right tabular-nums",
              render: (row) =>
                `${new Intl.NumberFormat("pt-BR", {
                  maximumFractionDigits: 1,
                }).format(row.marginPercent)}%`,
            },
          ]}
        />
      </SectionCard>

      <SectionCard title="Vendas por canal" description={rangeLabel}>
        <DataTable
          data={data?.salesByChannel ?? []}
          getId={(row) => row.channel}
          emptyMessage={emptyMessage}
          columns={[
            {
              key: "channel",
              label: "Canal",
              render: (row) => channelLabel[row.channel] ?? row.channel,
            },
            {
              key: "orderCount",
              label: "Vendas",
              className: "text-right tabular-nums",
            },
            {
              key: "grossSales",
              label: "Bruto",
              className: "text-right tabular-nums",
              render: (row) => brl(row.grossSales),
            },
            {
              key: "commission",
              label: "Comissão",
              className: "text-right tabular-nums",
              render: (row) => brl(row.commission),
            },
            {
              key: "netSales",
              label: "Líquido",
              className: "text-right tabular-nums",
              render: (row) => brl(row.netSales),
            },
          ]}
        />
      </SectionCard>
    </div>
  );
}
