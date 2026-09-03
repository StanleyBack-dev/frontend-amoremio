import { useCallback, useEffect, useState } from "react";
import StatCard from "@molecules/StatCard";
import SectionCard from "@/components/organisms/SectionCard";
import DataTable from "@/components/organisms/DataTable";
import { useToast } from "@/shared/toast/useToast";
import { useStoreContext } from "@/features/stores";
import { fetchFinanceDashboard } from "@/features/dashboard";
import type { FinanceDashboard } from "@/api/dashboard/schema";

const brl = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

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

export default function Dashboard() {
  const { showError } = useToast();
  const { activeStoreId } = useStoreContext();
  const [data, setData] = useState<FinanceDashboard | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!activeStoreId) {
      setData(null);
      return;
    }
    setLoading(true);
    try {
      setData(await fetchFinanceDashboard(activeStoreId));
    } catch (error) {
      showError(
        "Erro ao carregar dashboard",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }, [activeStoreId, showError]);

  useEffect(() => {
    void load();
  }, [load]);

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

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          tone="dark"
          label="Vendas"
          value={brl(totals?.totalSales ?? 0)}
          sub={`${totals?.salesCount ?? 0} venda(s) • líq. ${brl(
            totals?.netSales ?? 0,
          )}`}
        />
        <StatCard
          tone="dark"
          label="Comissões de canal"
          value={brl(totals?.totalCommission ?? 0)}
          sub="iFood, Rappi, etc. no período"
        />
        <StatCard
          tone="dark"
          label="Compras"
          value={brl(totals?.totalPurchases ?? 0)}
          sub={`${totals?.purchaseCount ?? 0} compra(s)`}
        />
        <StatCard
          tone="dark"
          label="Margem"
          value={brl(totals?.grossMargin ?? 0)}
          sub={`${(totals?.grossMarginPercent ?? 0).toFixed(
            1,
          )}% • líq. de comissão • CMV ${brl(totals?.costOfGoodsSold ?? 0)}`}
        />
        <StatCard
          tone="dark"
          label="Valor em estoque"
          value={brl(data?.stockValue ?? 0)}
          sub="custo médio × saldo"
        />
      </div>

      <SectionCard title="Top produtos por receita (30 dias)">
        <DataTable
          data={data?.topProducts ?? []}
          getId={(row) => row.idProduct}
          emptyMessage={
            loading ? "Carregando..." : "Nenhuma venda confirmada no período."
          }
          columns={[
            { key: "productName", label: "Produto" },
            {
              key: "quantitySold",
              label: "Qtd. vendida",
              render: (row) =>
                new Intl.NumberFormat("pt-BR", {
                  maximumFractionDigits: 3,
                }).format(row.quantitySold),
            },
            {
              key: "revenue",
              label: "Receita",
              render: (row) => brl(row.revenue),
            },
          ]}
        />
      </SectionCard>

      <SectionCard title="Lucro por produto (30 dias)">
        <DataTable
          data={data?.productProfitability ?? []}
          getId={(row) => row.idProduct}
          emptyMessage={
            loading ? "Carregando..." : "Nenhuma venda confirmada no período."
          }
          columns={[
            { key: "productName", label: "Produto" },
            {
              key: "quantitySold",
              label: "Qtd.",
              className: "text-right tabular-nums",
              render: (row) =>
                new Intl.NumberFormat("pt-BR", {
                  maximumFractionDigits: 3,
                }).format(row.quantitySold),
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

      <SectionCard title="Vendas por canal (30 dias)">
        <DataTable
          data={data?.salesByChannel ?? []}
          getId={(row) => row.channel}
          emptyMessage={
            loading ? "Carregando..." : "Nenhuma venda confirmada no período."
          }
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

      <SectionCard title="Compras × vendas por mês">
        <DataTable
          data={data?.monthlySeries ?? []}
          getId={(row) => row.month}
          emptyMessage="Sem movimentação no período."
          columns={[
            { key: "month", label: "Mês" },
            {
              key: "purchases",
              label: "Compras",
              render: (row) => brl(row.purchases),
            },
            {
              key: "sales",
              label: "Vendas",
              render: (row) => brl(row.sales),
            },
            {
              key: "net",
              label: "Resultado",
              render: (row) => brl(row.sales - row.purchases),
            },
          ]}
        />
      </SectionCard>
    </div>
  );
}
