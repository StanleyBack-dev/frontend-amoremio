import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  Boxes,
  Contact,
  CookingPot,
  Gift,
  Package,
  Percent,
  Receipt,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import StatCard from "@molecules/StatCard";
import Tabs from "@molecules/Tabs";
import SectionCard from "@/components/organisms/SectionCard";
import DataTable from "@/components/organisms/DataTable";
import DateRangeFilter from "@molecules/DateRangeFilter";
import SalesTimeSeriesChart from "@/components/charts/SalesTimeSeriesChart";
import TopProductsBarChart from "@/components/charts/TopProductsBarChart";
import ChannelMixDonut from "@/components/charts/ChannelMixDonut";
import ProductMixDonut from "@/components/charts/ProductMixDonut";
import CustomerMixDonut from "@/components/charts/CustomerMixDonut";
import CostComparisonBarChart from "@/components/charts/CostComparisonBarChart";
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
  FACULDADE: "Faculdade",
  PESSOAL: "Pessoal",
  OUTRO: "Outro",
};

const DEFAULT_PRESET = "last30" as const;

const DASHBOARD_TABS = [
  { id: "vendas", label: "Vendas" },
  { id: "itens", label: "Itens" },
  { id: "producao", label: "Produção" },
  { id: "clientes", label: "Clientes" },
] as const;

type DashboardTab = (typeof DASHBOARD_TABS)[number]["id"];

// Mirrors the icon each topic already uses in the sidebar, so the tab bar
// reads as the same vocabulary instead of a second icon set to learn.
const TAB_ICONS: Record<DashboardTab, ReactNode> = {
  vendas: <Receipt size={14} />,
  itens: <Package size={14} />,
  producao: <CookingPot size={14} />,
  clientes: <Contact size={14} />,
};

export default function Dashboard() {
  const { showError } = useToast();
  const { activeStoreId } = useStoreContext();
  const [data, setData] = useState<FinanceDashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [preset, setPreset] = useState<DateRangePreset>(DEFAULT_PRESET);
  const [range, setRange] = useState(() => computePresetRange(DEFAULT_PRESET));
  const [tab, setTab] = useState<DashboardTab>("vendas");

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

      <div
        className={`flex flex-col gap-6 transition-opacity duration-200 ${
          loading ? "opacity-60" : "opacity-100"
        }`}
      >
        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-subtle">
            Resumo do período
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard
              icon={<Receipt size={17} />}
              color="#93353D"
              label="Vendas"
              value={brl(totals?.totalSales ?? 0)}
              sub={`${totals?.salesCount ?? 0} venda(s) • líq. ${brl(
                totals?.netSales ?? 0,
              )}`}
            />
            <StatCard
              icon={<Percent size={17} />}
              color="#98702F"
              label="Comissões de canal"
              value={brl(totals?.totalCommission ?? 0)}
              sub="iFood, Rappi, etc. no período"
            />
            <StatCard
              icon={<ShoppingCart size={17} />}
              color="#B98C42"
              label="Compras"
              value={brl(totals?.totalPurchases ?? 0)}
              sub={`${totals?.purchaseCount ?? 0} compra(s)`}
            />
            <StatCard
              icon={<TrendingUp size={17} />}
              color="#1F7A46"
              label="Margem"
              value={brl(totals?.grossMargin ?? 0)}
              sub={`${(totals?.grossMarginPercent ?? 0).toFixed(
                1,
              )}% • líq. de comissão • CMV ${brl(totals?.costOfGoodsSold ?? 0)}`}
            />
            <StatCard
              icon={<Boxes size={17} />}
              color="#3B5C8A"
              label="Valor em estoque"
              value={brl(data?.stockValue ?? 0)}
              sub="custo médio × saldo"
            />
            <StatCard
              icon={<Contact size={17} />}
              color="#AD545B"
              label="Clientes"
              value={String(data?.customersCount ?? 0)}
              sub="cadastrados, ativos"
            />
          </div>
        </div>

        <SectionCard title="Compras × vendas" description={rangeLabel}>
          <SalesTimeSeriesChart
            data={data?.timeSeries ?? []}
            granularity={data?.granularity ?? "DAY"}
          />
        </SectionCard>
      </div>

      <div
        className={`flex flex-col gap-4 transition-opacity duration-200 ${
          loading ? "opacity-60" : "opacity-100"
        }`}
      >
        <Tabs
          items={DASHBOARD_TABS.map((item) => ({
            ...item,
            icon: TAB_ICONS[item.id],
          }))}
          active={tab}
          onChange={(id) => setTab(id as DashboardTab)}
        />

        {tab === "vendas" && (
          <div className="flex flex-col gap-6">
            <SectionCard title="Mix de canais" description={rangeLabel}>
              <ChannelMixDonut
                data={data?.salesByChannel ?? []}
                channelLabel={channelLabel}
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
                    mobileRender: (row) => `${row.orderCount} venda(s)`,
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
        )}

        {tab === "itens" && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <SectionCard
                title="Top produtos por receita"
                description={rangeLabel}
              >
                <TopProductsBarChart data={data?.topProducts ?? []} />
              </SectionCard>

              <SectionCard title="Mix de produtos" description={rangeLabel}>
                <ProductMixDonut data={data?.topProducts ?? []} />
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
                    // Subtitle on the mobile card — a bare quantity reads poorly there.
                    mobileRender: (row) =>
                      `${qty(row.quantitySold)} vendida(s) • ${brl(row.revenue)}`,
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
                        className={
                          row.netProfit < 0 ? "text-err-fg" : "text-ok-fg"
                        }
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
          </div>
        )}

        {tab === "producao" && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <StatCard
                icon={<CookingPot size={17} />}
                color="#EB6834"
                label="Custo de produção"
                value={brl(totals?.productionCost ?? 0)}
                sub="insumos consumidos em ordens de produção"
              />
              <StatCard
                icon={<Gift size={17} />}
                color="#9C877E"
                label="Custo de brindes/embalagens"
                value={brl(data?.giveawaysCost ?? 0)}
                sub="itens vendidos a R$0,00 (colher, canudo, saco…)"
              />
            </div>

            <SectionCard
              title="Compras × Produção × Vendas × Brindes"
              description={rangeLabel}
            >
              <CostComparisonBarChart
                data={[
                  {
                    key: "compras",
                    label: "Compras",
                    value: totals?.totalPurchases ?? 0,
                    color: "#B98C42",
                  },
                  {
                    key: "producao",
                    label: "Custo de produção",
                    value: totals?.productionCost ?? 0,
                    color: "#EB6834",
                  },
                  {
                    key: "vendas",
                    label: "Vendas (bruto)",
                    value: totals?.totalSales ?? 0,
                    color: "#93353D",
                  },
                  {
                    key: "brindes",
                    label: "Brindes/embalagens",
                    value: data?.giveawaysCost ?? 0,
                    color: "#9C877E",
                  },
                ]}
              />
            </SectionCard>

            <SectionCard
              title="Consumo de insumos em produção"
              description={rangeLabel}
            >
              <DataTable
                data={data?.topProductionInputs ?? []}
                getId={(row) => row.idProduct}
                emptyMessage={
                  loading
                    ? "Carregando..."
                    : "Nenhuma ordem de produção concluída no período."
                }
                columns={[
                  { key: "productName", label: "Insumo" },
                  {
                    key: "quantityConsumed",
                    label: "Qtd. consumida",
                    className: "text-right tabular-nums",
                    render: (row) => qty(row.quantityConsumed),
                  },
                  {
                    key: "cost",
                    label: "Custo",
                    className: "text-right tabular-nums font-semibold",
                    render: (row) => brl(row.cost),
                  },
                ]}
              />
            </SectionCard>

            <SectionCard
              title="Itens sem receita (brindes/embalagens)"
              description={rangeLabel}
            >
              <DataTable
                data={(data?.productProfitability ?? []).filter(
                  (row) => row.revenue === 0 && row.cost > 0,
                )}
                getId={(row) => row.idProduct}
                emptyMessage={
                  loading
                    ? "Carregando..."
                    : "Nenhum item de custo zero-receita vendido no período."
                }
                columns={[
                  { key: "productName", label: "Item" },
                  {
                    key: "quantitySold",
                    label: "Qtd.",
                    className: "text-right tabular-nums",
                    render: (row) => qty(row.quantitySold),
                  },
                  {
                    key: "cost",
                    label: "Custo",
                    className: "text-right tabular-nums font-semibold",
                    render: (row) => brl(row.cost),
                  },
                ]}
              />
            </SectionCard>
          </div>
        )}

        {tab === "clientes" && (
          <div className="flex flex-col gap-6">
            <SectionCard title="Mix de clientes" description={rangeLabel}>
              <CustomerMixDonut data={data?.salesByCustomer ?? []} />
            </SectionCard>

            <SectionCard title="Clientes por vendas" description={rangeLabel}>
              <DataTable
                data={data?.salesByCustomer ?? []}
                getId={(row) => row.idCustomer ?? row.customerName}
                emptyMessage={emptyMessage}
                columns={[
                  { key: "customerName", label: "Cliente" },
                  {
                    key: "orderCount",
                    label: "Vendas",
                    className: "text-right tabular-nums",
                    mobileRender: (row) => `${row.orderCount} venda(s)`,
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
        )}
      </div>
    </div>
  );
}
