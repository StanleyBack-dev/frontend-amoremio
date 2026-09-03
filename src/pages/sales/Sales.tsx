import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Button from "@atoms/Button";
import Input from "@atoms/Input";
import CurrencyInput from "@atoms/CurrencyInput";
import NumberInput from "@atoms/NumberInput";
import Select from "@atoms/Select";
import Badge from "@atoms/Badge";
import ConfirmDialog from "@/components/molecules/ConfirmDialog";
import FilterPanel from "@/components/molecules/FilterPanel";
import Pagination from "@/components/molecules/Pagination";
import SectionCard from "@/components/organisms/SectionCard";
import DataTable from "@/components/organisms/DataTable";
import Drawer from "@/components/organisms/Drawer";
import { useTablePagination } from "@/shared/pagination/useTablePagination";
import { useToast } from "@/shared/toast/useToast";
import { useLoading } from "@/shared/loading";
import { useStoreContext } from "@/features/stores";
import { fetchProducts, productOptionLabel } from "@/features/catalog";
import { fetchStoreStock } from "@/features/inventory";
import { formatDateTimeDisplay } from "@/utils/format";
import type { Product } from "@/api/catalog/schema";
import type {
  ListSalesOrdersParams,
  SalesOrder,
  SalesOrderFilterOptions,
} from "@/api/sales/schema";
import {
  addSalesOrderItem,
  calcSalesLineTotal,
  cancelSalesOrder,
  confirmSalesOrder,
  createSalesOrder,
  fetchSalesOrderById,
  fetchSalesOrders,
  fetchSalesOrderFilterOptions,
  removeSalesOrderItem,
  salesChannelLabel,
  salesChannelOptions,
  salesOrderStatusLabel,
  updateSalesOrderHeader,
} from "@/features/sales";
import type { SalesChannel, SalesDiscountMode } from "@/api/sales/schema";

const round2 = (value: number) => Math.round(value * 100) / 100;

const qtyFmt = (value: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(value);

const brl = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const statusTone: Record<string, "warning" | "success" | "danger"> = {
  ABERTA: "warning",
  CONFIRMADA: "success",
  CANCELADA: "danger",
};

type PendingConfirm =
  | { kind: "removeItem"; idSalesOrderItem: string; productName: string }
  | { kind: "cancel" }
  | { kind: "confirm" }
  | null;

export default function Sales() {
  const { showError, showSuccess } = useToast();
  const { track } = useLoading();
  const { activeStore, activeStoreId } = useStoreContext();
  const canManage =
    activeStore?.role === "DONO" ||
    activeStore?.role === "GERENTE" ||
    activeStore?.role === null;

  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  // idProduct -> quantity on hand, to keep the item picker to what can be sold.
  const [stockByProduct, setStockByProduct] = useState<Map<string, number>>(
    new Map(),
  );
  const [open, setOpen] = useState<SalesOrder | null>(null);
  // "Nova venda" opens the form without creating anything — the record is
  // created when the first item is added (see handleAddItem).
  const [composingNew, setComposingNew] = useState(false);
  const [busy, setBusy] = useState(false);

  const [customer, setCustomer] = useState("");
  const [discount, setDiscount] = useState(0);
  const [discountMode, setDiscountMode] =
    useState<SalesDiscountMode>("VALOR");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [channel, setChannel] = useState<SalesChannel>("BALCAO");
  const [commission, setCommission] = useState(0);

  const [itemProduct, setItemProduct] = useState("");
  const [itemQty, setItemQty] = useState(0);
  const [itemPrice, setItemPrice] = useState(0);

  const [confirm, setConfirm] = useState<PendingConfirm>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  // Synchronous lock — confirmBusy state updates too late to block a fast
  // double click on the dialog's confirm button.
  const confirmLock = useRef(false);

  const emptyFilters = { customer: "", channel: "", status: "", createdBy: "" };
  const [filters, setFilters] = useState(emptyFilters);
  const [filterOptions, setFilterOptions] = useState<SalesOrderFilterOptions>({
    customers: [],
    channels: [],
    creators: [],
  });
  const {
    page: listPage,
    limit: listLimit,
    meta: listMeta,
    setPage: setListPage,
    setLimit: setListLimit,
    setMeta: setListMeta,
    reset: resetListPage,
  } = useTablePagination();
  const hasActiveFilters = Object.values(filters).some(Boolean);

  const patchFilters = (patch: Partial<typeof emptyFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    resetListPage();
  };
  const clearFilters = () => {
    setFilters(emptyFilters);
    resetListPage();
  };

  const buildListParams = useCallback((): ListSalesOrdersParams => {
    const params: ListSalesOrdersParams = {
      idStore: activeStoreId as string,
      page: listPage,
      limit: listLimit,
    };
    if (filters.customer) params.customerName = filters.customer;
    if (filters.channel) {
      params.salesChannel = filters.channel as SalesChannel;
    }
    if (filters.status) {
      params.status = filters.status as ListSalesOrdersParams["status"];
    }
    if (filters.createdBy) params.createdByUserId = filters.createdBy;
    return params;
  }, [activeStoreId, filters, listPage, listLimit]);

  const loadList = useCallback(async () => {
    if (!activeStoreId) return;
    try {
      const [orderResult, prods, stock] = await Promise.all([
        fetchSalesOrders(buildListParams()),
        fetchProducts({
          idStore: activeStoreId,
          limit: 500,
          status: true,
          kinds: ["PRODUTO_FINAL"],
        }),
        fetchStoreStock({
          idStore: activeStoreId,
          kind: "PRODUTO_FINAL",
          limit: 200,
        }),
      ]);
      setOrders(orderResult.items);
      setListMeta({
        total: orderResult.pagination.total,
        totalPages: orderResult.pagination.totalPages,
      });
      setProducts(prods.items);
      setStockByProduct(
        new Map(
          stock.items.map((item) => [item.idProduct, item.quantityOnHand]),
        ),
      );
    } catch (error) {
      showError(
        "Erro ao carregar vendas",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    }
  }, [activeStoreId, buildListParams, setListMeta, showError]);

  const loadFilterOptions = useCallback(async () => {
    if (!activeStoreId) return;
    try {
      setFilterOptions(await fetchSalesOrderFilterOptions(activeStoreId));
    } catch {
      setFilterOptions({ customers: [], channels: [], creators: [] });
    }
  }, [activeStoreId]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    void loadFilterOptions();
  }, [loadFilterOptions]);

  function syncHeader(order: SalesOrder) {
    setCustomer(order.customerName ?? "");
    setDiscount(order.discountAmount ?? 0);
    setDiscountMode(order.discountMode ?? "VALOR");
    setDiscountPercent(order.discountPercent ?? 0);
    setChannel(order.salesChannel);
    setCommission(order.commissionPercent ?? 0);
  }

  async function refreshOpen(idSalesOrder: string) {
    if (!activeStoreId) return;
    const fresh = await track(fetchSalesOrderById(activeStoreId, idSalesOrder));
    setOpen(fresh);
    syncHeader(fresh);
  }

  // Only finished goods that actually have stock can be sold — selling more
  // than is on hand is a hard error on the backend anyway.
  const sellableProducts = useMemo(
    () =>
      products.filter(
        (product) => (stockByProduct.get(product.idProduct) ?? 0) > 0,
      ),
    [products, stockByProduct],
  );

  // Opens the form only; nothing is persisted until the first item is added.
  function handleNew() {
    setOpen(null);
    setComposingNew(true);
    setCustomer("");
    setDiscount(0);
    setDiscountMode("VALOR");
    setDiscountPercent(0);
    setChannel("BALCAO");
    setCommission(0);
    setItemProduct("");
    setItemQty(0);
    setItemPrice(0);
  }

  function closeDrawer() {
    setOpen(null);
    setComposingNew(false);
    void loadList();
    void loadFilterOptions();
  }

  // `next` lets the R$/% selector persist its just-picked value without
  // waiting for the state update.
  async function saveHeader(next?: {
    discountMode?: SalesDiscountMode;
    discountPercent?: number;
  }) {
    if (!activeStoreId || !open) return;
    try {
      const updated = await updateSalesOrderHeader({
        idStore: activeStoreId,
        idSalesOrder: open.idSalesOrder,
        customerName: customer.trim(),
        discountAmount: discount,
        discountMode: next?.discountMode ?? discountMode,
        discountPercent: next?.discountPercent ?? discountPercent,
        salesChannel: channel,
        commissionPercent: commission,
      });
      // Only refresh the computed side (subtotal/total/commission). The
      // input-bound fields already hold what the user just typed — re-syncing
      // them from the response would fight edits and, if an older BFF/back end
      // omits a field, silently revert it.
      setOpen(updated);
    } catch (error) {
      showError(
        "Erro ao salvar",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    }
  }

  function handleDiscountModeChange(mode: SalesDiscountMode) {
    setDiscountMode(mode);
    if (open) void saveHeader({ discountMode: mode });
  }

  const liveLineTotal = useMemo(
    () => calcSalesLineTotal(itemQty, itemPrice),
    [itemQty, itemPrice],
  );

  // Stock guard for the item being added: what's on hand minus what this same
  // order already reserves for that product.
  const selectedProduct = useMemo(
    () => sellableProducts.find((p) => p.idProduct === itemProduct) ?? null,
    [sellableProducts, itemProduct],
  );
  const availableForSelected = useMemo(() => {
    if (!itemProduct) return 0;
    const onHand = stockByProduct.get(itemProduct) ?? 0;
    const reserved = (open?.items ?? [])
      .filter((i) => i.idProduct === itemProduct)
      .reduce((sum, i) => sum + i.quantity, 0);
    return round2(onHand - reserved);
  }, [itemProduct, stockByProduct, open]);
  const exceedsStock = !!itemProduct && itemQty > availableForSelected;

  async function handleAddItem() {
    if (busy || !activeStoreId || !itemProduct) return;
    if (itemQty <= 0) {
      showError("Quantidade inválida", "Informe um valor maior que zero.");
      return;
    }
    if (exceedsStock) {
      showError(
        "Estoque insuficiente",
        "A quantidade é maior do que o disponível em estoque.",
      );
      return;
    }
    setBusy(true);
    try {
      let idSalesOrder = open?.idSalesOrder;
      // First item of a new sale: create the record now and carry over any
      // header fields that were already typed.
      if (!idSalesOrder) {
        const created = await createSalesOrder({ idStore: activeStoreId });
        idSalesOrder = created.idSalesOrder;
        if (
          customer.trim() ||
          discount > 0 ||
          discountPercent > 0 ||
          channel !== "BALCAO" ||
          commission > 0
        ) {
          await updateSalesOrderHeader({
            idStore: activeStoreId,
            idSalesOrder,
            customerName: customer.trim(),
            discountAmount: discount,
            discountMode,
            discountPercent,
            salesChannel: channel,
            commissionPercent: commission,
          });
        }
      }
      const updated = await addSalesOrderItem({
        idStore: activeStoreId,
        idSalesOrder,
        idProduct: itemProduct,
        quantity: itemQty,
        unitPrice: itemPrice > 0 ? itemPrice : undefined,
      });
      setOpen(updated);
      setComposingNew(false);
      syncHeader(updated);
      setItemProduct("");
      setItemQty(0);
      setItemPrice(0);
    } catch (error) {
      showError(
        "Erro ao adicionar item",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveItem(idSalesOrderItem: string) {
    if (!activeStoreId || !open) return;
    try {
      setOpen(
        await removeSalesOrderItem(
          activeStoreId,
          open.idSalesOrder,
          idSalesOrderItem,
        ),
      );
    } catch (error) {
      showError(
        "Erro ao remover item",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    }
  }

  async function handleConfirm() {
    if (!activeStoreId || !open) return;
    setBusy(true);
    try {
      const confirmed = await confirmSalesOrder(
        activeStoreId,
        open.idSalesOrder,
      );
      showSuccess("Venda confirmada", "");
      setOpen(confirmed);
      await loadList();
    } catch (error) {
      showError(
        "Erro ao confirmar",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    if (!activeStoreId || !open) return;
    setBusy(true);
    try {
      await cancelSalesOrder(activeStoreId, open.idSalesOrder);
      showSuccess("Venda cancelada", "");
      closeDrawer();
    } catch (error) {
      showError(
        "Erro ao cancelar",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function runConfirm() {
    if (!confirm || confirmLock.current) return;
    confirmLock.current = true;
    setConfirmBusy(true);
    try {
      if (confirm.kind === "removeItem") {
        await handleRemoveItem(confirm.idSalesOrderItem);
      } else if (confirm.kind === "cancel") {
        await handleCancel();
      } else {
        await handleConfirm();
      }
      setConfirm(null);
    } finally {
      confirmLock.current = false;
      setConfirmBusy(false);
    }
  }

  if (!activeStoreId) {
    return (
      <div className="flex flex-col gap-6">
        <SectionCard title="Nenhuma loja ativa">
          <p className="text-[13px] text-ink-muted">
            Selecione uma loja em <strong className="text-ink">Lojas</strong>{" "}
            para registrar vendas.
          </p>
        </SectionCard>
      </div>
    );
  }

  const isOpen = composingNew || open?.status === "ABERTA";

  // While the sale is editable, the discount / total follow the fields being
  // typed; once confirmed they show the frozen values.
  const subtotalShown = open?.itemsSubtotal ?? 0;
  const discountShown = isOpen
    ? discountMode === "PERCENTUAL"
      ? round2(subtotalShown * (discountPercent / 100))
      : discount
    : (open?.discountAmount ?? 0);
  const totalShown = Math.max(0, subtotalShown - discountShown);

  // Read-only detail panel shown when a confirmed sale's row is expanded.
  function renderSaleDetails(order: SalesOrder) {
    const info: [string, ReactNode][] = [
      ["Cliente", order.customerName ?? "—"],
      ["Canal", salesChannelLabel[order.salesChannel]],
      ["Data do pedido", new Date(order.orderDate).toLocaleDateString("pt-BR")],
      ["Criado por", order.createdByUserName ?? "—"],
      ["Criado em", formatDateTimeDisplay(order.createdAt)],
      [
        "Confirmado em",
        order.confirmedAt ? formatDateTimeDisplay(order.confirmedAt) : "—",
      ],
    ];
    const totals: [string, ReactNode][] = [
      ["Subtotal", brl(order.itemsSubtotal)],
      [
        order.discountMode === "PERCENTUAL"
          ? `Desconto (${order.discountPercent}%)`
          : "Desconto",
        `− ${brl(order.discountAmount)}`,
      ],
      ["Total", brl(order.total)],
    ];
    if (order.commissionAmount > 0 || order.commissionPercent > 0) {
      totals.push([
        `Comissão ${salesChannelLabel[order.salesChannel]} (${order.commissionPercent}%)`,
        `− ${brl(order.commissionAmount)}`,
      ]);
      totals.push(["Total líquido", brl(order.netTotal)]);
    }

    const sectionHead =
      "bg-shell px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.07em] text-cream-muted";
    const th = `${sectionHead} text-left`;

    return (
      <div className="overflow-hidden rounded-lg border border-hairline bg-card">
        <div className={sectionHead}>Detalhes da venda</div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 px-4 py-3 sm:grid-cols-3 lg:grid-cols-4">
          {info.map(([label, value]) => (
            <div key={label} className="flex flex-col gap-0.5">
              <dt className="text-[10px] font-medium uppercase tracking-wide text-ink-subtle">
                {label}
              </dt>
              <dd className="text-[13px] text-ink">{value}</dd>
            </div>
          ))}
        </dl>

        <table className="w-full border-t border-hairline text-[12px]">
          <thead>
            <tr>
              <th className={th}>Produto</th>
              <th className={`${th} text-right`}>Qtd.</th>
              <th className={`${th} text-right`}>Valor un.</th>
              <th className={`${th} text-right`}>Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr
                key={item.idSalesOrderItem}
                className="border-t border-hairline"
              >
                <td className="px-4 py-2 text-ink">{item.productName}</td>
                <td className="px-4 py-2 text-right tabular-nums text-ink">
                  {qtyFmt(item.quantity)}
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-ink">
                  {brl(item.unitPrice)}
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-ink">
                  {brl(item.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end border-t border-hairline bg-card-alt/40 px-4 py-3">
          <dl className="w-full max-w-xs space-y-1 text-[12px]">
            {totals.map(([label, value], index) => (
              <div
                key={label}
                className={`flex justify-between gap-3 ${
                  index === totals.length - 1
                    ? "border-t border-hairline pt-1 font-semibold text-ink"
                    : "text-ink-muted"
                }`}
              >
                <dt>{label}</dt>
                <dd className="tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {order.notes && (
          <p className="border-t border-hairline px-4 py-3 text-[12px] text-ink-muted">
            <span className="font-medium text-ink">Observações: </span>
            {order.notes}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionCard
        title="Vendas"
        action={
          canManage ? (
            <Button variant="primary" loading={busy} onClick={handleNew}>
              Nova venda
            </Button>
          ) : undefined
        }
      >
        <FilterPanel hasActiveFilters={hasActiveFilters}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Select
              label="Cliente"
              value={filters.customer}
              onChange={(e) =>
                patchFilters({ customer: e.target.value })
              }
            >
              <option value="">Todos</option>
              {filterOptions.customers.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>

            <Select
              label="Canal"
              value={filters.channel}
              onChange={(e) =>
                patchFilters({ channel: e.target.value })
              }
            >
              <option value="">Todos</option>
              {filterOptions.channels.map((ch) => (
                <option key={ch} value={ch}>
                  {salesChannelLabel[ch]}
                </option>
              ))}
            </Select>

            <Select
              label="Situação"
              value={filters.status}
              onChange={(e) =>
                patchFilters({ status: e.target.value })
              }
            >
              <option value="">Todas</option>
              <option value="ABERTA">Aberta</option>
              <option value="CONFIRMADA">Confirmada</option>
              <option value="CANCELADA">Cancelada</option>
            </Select>

            <Select
              label="Criado por"
              value={filters.createdBy}
              onChange={(e) =>
                patchFilters({ createdBy: e.target.value })
              }
            >
              <option value="">Todos</option>
              {filterOptions.creators.map((creator) => (
                <option key={creator.id} value={creator.id}>
                  {creator.name}
                </option>
              ))}
            </Select>

            <div className="flex items-end justify-end lg:col-span-4">
              <Button
                type="button"
                variant="secondary"
                disabled={!hasActiveFilters}
                onClick={clearFilters}
              >
                Limpar filtros
              </Button>
            </div>
          </div>
        </FilterPanel>

        <DataTable
          data={orders}
          getId={(row) => row.idSalesOrder}
          emptyMessage="Nenhuma venda registrada."
          onView={(row) => refreshOpen(row.idSalesOrder)}
          viewLabel="Abrir venda"
          canExpand={(row) => row.status === "CONFIRMADA"}
          renderExpanded={(row) => renderSaleDetails(row)}
          columns={[
            {
              key: "orderDate",
              label: "Data",
              render: (row) =>
                new Date(row.orderDate).toLocaleDateString("pt-BR"),
            },
            {
              key: "customerName",
              label: "Cliente",
              render: (row) => row.customerName ?? "—",
            },
            {
              key: "salesChannel",
              label: "Canal",
              render: (row) => salesChannelLabel[row.salesChannel],
            },
            {
              key: "status",
              label: "Situação",
              render: (row) => (
                <Badge tone={statusTone[row.status] ?? "neutral"}>
                  {salesOrderStatusLabel[row.status]}
                </Badge>
              ),
            },
            {
              key: "total",
              label: "Total",
              className: "text-right tabular-nums",
              render: (row) => brl(row.total),
            },
            {
              key: "netTotal",
              label: "Líquido",
              className: "text-right tabular-nums",
              render: (row) =>
                row.commissionAmount > 0 ? brl(row.netTotal) : "—",
            },
            {
              key: "createdByUserName",
              label: "Criado por",
              render: (row) => row.createdByUserName ?? "—",
            },
            {
              key: "createdAt",
              label: "Criado em",
              className: "tabular-nums",
              render: (row) => formatDateTimeDisplay(row.createdAt),
            },
          ]}
        />

        <Pagination
          page={listPage}
          pageCount={listMeta.totalPages}
          total={listMeta.total}
          pageSize={listLimit}
          onPageChange={setListPage}
          onPageSizeChange={setListLimit}
        />
      </SectionCard>

      <Drawer
        open={!!open || composingNew}
        onClose={closeDrawer}
        width="xl"
        title={
          open ? `Venda ${salesOrderStatusLabel[open.status]}` : "Nova venda"
        }
        subtitle={open?.customerName ?? undefined}
      >
        {(open || composingNew) && (
          <div className="flex flex-col gap-5">
            {composingNew && !open && (
              <p className="rounded-md border border-hairline bg-card-alt px-3 py-2 text-[12px] text-ink-muted">
                A venda é registrada quando você adicionar o primeiro item.
                Fechar agora não cria nada.
              </p>
            )}
            <SectionCard title="Dados da venda">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  label="Cliente"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  onBlur={() => saveHeader()}
                  disabled={!isOpen}
                />
                <Select
                  label="Canal de venda"
                  value={channel}
                  onChange={(e) => {
                    setChannel(e.target.value as SalesChannel);
                  }}
                  onBlur={() => saveHeader()}
                  disabled={!isOpen}
                >
                  {salesChannelOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                <NumberInput
                  label="Comissão do canal (%)"
                  value={commission}
                  onValueChange={setCommission}
                  onBlur={() => saveHeader()}
                  disabled={!isOpen}
                  maxDecimals={2}
                  hint="ex.: iFood ~12% a 27%"
                />
                <div>
                  <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
                    Desconto
                  </span>
                  <div className="grid grid-cols-[4.5rem_1fr] gap-2">
                    <Select
                      value={discountMode}
                      disabled={!isOpen}
                      onChange={(e) =>
                        handleDiscountModeChange(
                          e.target.value as SalesDiscountMode,
                        )
                      }
                    >
                      <option value="VALOR">R$</option>
                      <option value="PERCENTUAL">%</option>
                    </Select>
                    {discountMode === "PERCENTUAL" ? (
                      <NumberInput
                        value={discountPercent}
                        onValueChange={setDiscountPercent}
                        onBlur={() => saveHeader()}
                        disabled={!isOpen}
                        maxDecimals={2}
                        suffix="%"
                      />
                    ) : (
                      <CurrencyInput
                        value={discount}
                        onValueChange={setDiscount}
                        onBlur={() => saveHeader()}
                        disabled={!isOpen}
                      />
                    )}
                  </div>
                  {discountMode === "PERCENTUAL" && (
                    <p className="mt-1 text-[11px] text-ink-subtle tabular-nums">
                      = {brl(discountShown)} sobre {brl(subtotalShown)}
                    </p>
                  )}
                </div>
              </div>
            </SectionCard>

            {isOpen && (
              <SectionCard title="Adicionar item">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Select
                    label="Produto"
                    value={itemProduct}
                    onChange={(e) => {
                      setItemProduct(e.target.value);
                      const prod = sellableProducts.find(
                        (p) => p.idProduct === e.target.value,
                      );
                      if (prod?.salePrice != null && itemPrice === 0)
                        setItemPrice(prod.salePrice);
                    }}
                  >
                    <option value="">
                      {sellableProducts.length === 0
                        ? "Nenhum produto final com estoque"
                        : "Selecione"}
                    </option>
                    {sellableProducts.map((product) => (
                      <option key={product.idProduct} value={product.idProduct}>
                        {productOptionLabel(product)} ·{" "}
                        {stockByProduct.get(product.idProduct) ?? 0} em estoque
                      </option>
                    ))}
                  </Select>
                  <NumberInput
                    label="Quantidade"
                    value={itemQty}
                    onValueChange={setItemQty}
                    error={
                      exceedsStock
                        ? `Máx. ${qtyFmt(availableForSelected)} em estoque`
                        : undefined
                    }
                    hint={
                      itemProduct && !exceedsStock
                        ? `${qtyFmt(availableForSelected)} disponível em estoque`
                        : undefined
                    }
                  />
                  <CurrencyInput
                    label="Valor unitário"
                    value={itemPrice}
                    onValueChange={setItemPrice}
                    hint="padrão: preço de venda do produto"
                  />
                  <div className="flex flex-col justify-end rounded-md border border-hairline bg-card-alt px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-ink-subtle">
                      Total da linha
                    </p>
                    <p className="text-lg font-semibold text-brand-600 tabular-nums">
                      {brl(liveLineTotal)}
                    </p>
                  </div>
                </div>
                {exceedsStock && selectedProduct && (
                  <p className="mt-3 rounded-md border border-err-border bg-err-bg px-3 py-2 text-[12px] text-err-fg">
                    A quantidade ({qtyFmt(itemQty)}) de{" "}
                    <strong>{selectedProduct.name}</strong> é maior do que o
                    disponível em estoque ({qtyFmt(availableForSelected)}
                    ). Ajuste o valor para adicionar à venda.
                  </p>
                )}
                <div className="mt-4">
                  <Button
                    variant="primary"
                    loading={busy}
                    disabled={
                      busy || !itemProduct || itemQty <= 0 || exceedsStock
                    }
                    onClick={handleAddItem}
                  >
                    Adicionar à venda
                  </Button>
                </div>
              </SectionCard>
            )}

            <SectionCard title="Itens da venda">
              <DataTable
                data={open?.items ?? []}
                getId={(row) => row.idSalesOrderItem}
                emptyMessage="Nenhum item adicionado."
                columns={[
                  { key: "productName", label: "Produto" },
                  {
                    key: "quantity",
                    label: "Qtd.",
                    className: "text-right tabular-nums",
                  },
                  {
                    key: "unitPrice",
                    label: "Valor un.",
                    className: "text-right tabular-nums",
                    render: (row) => brl(row.unitPrice),
                  },
                  {
                    key: "lineTotal",
                    label: "Total",
                    className: "text-right tabular-nums",
                    render: (row) => brl(row.lineTotal),
                  },
                  ...(isOpen
                    ? [
                        {
                          key: "actions",
                          label: "",
                          className: "text-right",
                          render: (row: SalesOrder["items"][number]) => (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="!text-err-fg hover:!bg-err-bg"
                              onClick={() =>
                                setConfirm({
                                  kind: "removeItem",
                                  idSalesOrderItem: row.idSalesOrderItem,
                                  productName: row.productName,
                                })
                              }
                            >
                              Remover
                            </Button>
                          ),
                        },
                      ]
                    : []),
                ]}
              />

              {open && (
                <dl className="mt-4 space-y-1.5 border-t border-hairline pt-4 text-[13px]">
                  <div className="flex justify-between">
                    <dt className="text-ink-muted">Subtotal</dt>
                    <dd className="tabular-nums">{brl(open.itemsSubtotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-muted">
                      Desconto
                      {(isOpen
                        ? discountMode === "PERCENTUAL"
                        : open.discountMode === "PERCENTUAL") && (
                        <span className="ml-1 text-ink-subtle">
                          (
                          {isOpen ? discountPercent : open.discountPercent}
                          %)
                        </span>
                      )}
                    </dt>
                    <dd className="tabular-nums">− {brl(discountShown)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-hairline pt-1.5 text-[15px] font-semibold">
                    <dt>Total</dt>
                    <dd className="tabular-nums">{brl(totalShown)}</dd>
                  </div>
                  {(open.commissionAmount > 0 ||
                    open.commissionPercent > 0) && (
                    <>
                      <div className="flex justify-between">
                        <dt className="text-ink-muted">
                          Comissão {salesChannelLabel[open.salesChannel]} (
                          {open.commissionPercent.toFixed(2)}%)
                        </dt>
                        <dd className="tabular-nums">
                          − {brl(open.commissionAmount)}
                        </dd>
                      </div>
                      <div className="flex justify-between border-t border-hairline pt-1.5 text-[15px] font-semibold text-brand-600">
                        <dt>Total líquido</dt>
                        <dd className="tabular-nums">{brl(open.netTotal)}</dd>
                      </div>
                    </>
                  )}
                </dl>
              )}

              {open && open.status === "ABERTA" && canManage && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="primary"
                    loading={busy}
                    disabled={busy || open.items.length === 0}
                    onClick={() => setConfirm({ kind: "confirm" })}
                  >
                    Confirmar venda
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setConfirm({ kind: "cancel" })}
                  >
                    Cancelar venda
                  </Button>
                </div>
              )}
            </SectionCard>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={confirm !== null}
        loading={confirmBusy}
        onCancel={() => {
          if (!confirmBusy) setConfirm(null);
        }}
        onConfirm={runConfirm}
        variant={confirm?.kind === "confirm" ? "warning" : "danger"}
        title={
          confirm?.kind === "removeItem"
            ? "Remover item"
            : confirm?.kind === "cancel"
              ? "Cancelar venda"
              : "Confirmar venda"
        }
        confirmLabel={
          confirm?.kind === "removeItem"
            ? "Remover"
            : confirm?.kind === "cancel"
              ? "Cancelar venda"
              : "Confirmar venda"
        }
        cancelLabel={confirm?.kind === "cancel" ? "Voltar" : "Cancelar"}
        description={
          confirm?.kind === "removeItem" ? (
            <>
              Remover{" "}
              <strong className="text-ink">{confirm.productName}</strong> desta
              venda?
            </>
          ) : confirm?.kind === "cancel" ? (
            "A venda será marcada como cancelada e não poderá mais ser editada nem confirmada."
          ) : (
            "A venda será confirmada e não poderá mais ser editada."
          )
        }
      />
    </div>
  );
}
