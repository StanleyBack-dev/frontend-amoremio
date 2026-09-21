import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Plus, Receipt } from "lucide-react";
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
import Modal from "@/components/organisms/Modal";
import { useTablePagination } from "@/shared/pagination/useTablePagination";
import { useToast } from "@/shared/toast/useToast";
import { useLoading } from "@/shared/loading";
import { useStoreContext } from "@/features/stores";
import {
  fetchProducts,
  productOptionLabel,
  SELLABLE_KINDS,
} from "@/features/catalog";
import { fetchStoreStock, fetchStockMovements } from "@/features/inventory";
import type { StockMovement } from "@/api/inventory/schema";
import {
  formatBrazilianPhone,
  formatDateOnlyDisplay,
  formatDateTimeDisplay,
} from "@/utils/format";
import type { Product } from "@/api/catalog/schema";
import { createCustomer, fetchCustomers } from "@/features/customers";
import type { Customer } from "@/api/customers/schema";
import {
  fetchUnmappedChannelProducts,
  mapChannelProduct,
} from "@/features/channel-orders";
import type { UnmappedChannelProduct } from "@/api/channel-orders/schema";
import type {
  ListSalesOrdersParams,
  SalesOrder,
  SalesOrderFilterOptions,
} from "@/api/sales/schema";
import {
  addSalesOrderItems,
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

type StagedSalesItem = {
  key: string;
  idProduct: string;
  quantity: number;
  unitPrice: number;
};

const emptyCustomerForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
};

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
  // created when the staged list is first saved (see handleSaveStaged).
  const [composingNew, setComposingNew] = useState(false);
  const [busy, setBusy] = useState(false);

  // idCustomer drives the linked customer (a real FK, unlike Compras'
  // free-text supplierName) — customerName is kept only as a display
  // snapshot for legacy orders that predate this link.
  const [idCustomer, setIdCustomer] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState(emptyCustomerForm);
  const [savingCustomer, setSavingCustomer] = useState(false);

  const [unmappedProducts, setUnmappedProducts] = useState<
    UnmappedChannelProduct[]
  >([]);
  // Keyed by `${channel}:${externalProductId}` — the product picked for
  // each pending row before "Salvar" is clicked.
  const [mappingChoice, setMappingChoice] = useState<Record<string, string>>(
    {},
  );
  const [savingMappingKey, setSavingMappingKey] = useState<string | null>(null);

  const [orderDate, setOrderDate] = useState("");
  const [discount, setDiscount] = useState(0);
  const [discountMode, setDiscountMode] = useState<SalesDiscountMode>("VALOR");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [channel, setChannel] = useState<SalesChannel>("BALCAO");
  const [commission, setCommission] = useState(0);

  // Calculator: derives discountAmount/commissionPercent from what the
  // delivery platform's statement actually reports (a promo discount and
  // the net amount deposited), instead of the user reverse-engineering the
  // commission percentage by hand. "Aplicar" fills the fields above and
  // saves immediately, same as every other field in this section.
  const [calcDiscount, setCalcDiscount] = useState(0);
  const [calcNetReceived, setCalcNetReceived] = useState(0);

  const [itemProduct, setItemProduct] = useState("");
  const [itemQty, setItemQty] = useState(0);
  const [itemPrice, setItemPrice] = useState(0);
  // Staged items — same add-to-list pattern as Compras/Receitas: pile up
  // locally (no network call) and send everything in one bulk request,
  // instead of one round-trip per product added.
  const [staged, setStaged] = useState<StagedSalesItem[]>([]);

  const [statementOrder, setStatementOrder] = useState<SalesOrder | null>(null);
  const [statementMovements, setStatementMovements] = useState<StockMovement[]>(
    [],
  );
  const [statementLoading, setStatementLoading] = useState(false);

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
          // Finished goods AND sale-only items (brindes, embalagens avulsas…)
          // — anything a recipe can't consume/produce, see RECIPE_INPUT/
          // OUTPUT_KINDS. Purchasable inputs are excluded on the backend too.
          kinds: SELLABLE_KINDS,
        }),
        // No `kind` filter: SELLABLE_KINDS spans two product kinds, and the
        // stock endpoint only filters by one at a time.
        fetchStoreStock({
          idStore: activeStoreId,
          limit: 500,
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

  const loadCustomers = useCallback(async () => {
    if (!activeStoreId) return;
    try {
      const result = await fetchCustomers({
        idStore: activeStoreId,
        limit: 500,
        status: true,
      });
      setCustomers(result.items);
    } catch {
      setCustomers([]);
    }
  }, [activeStoreId]);

  // Items from 99Food/iFood orders that arrived but couldn't resolve to a
  // product yet — see channel-orders module. Mapping one here can promote
  // several held-back orders at once (see handleMapChannelProduct), which
  // is why loadList() runs again after a successful save.
  const loadUnmappedChannelProducts = useCallback(async () => {
    if (!activeStoreId) return;
    try {
      setUnmappedProducts(await fetchUnmappedChannelProducts(activeStoreId));
    } catch {
      setUnmappedProducts([]);
    }
  }, [activeStoreId]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    void loadFilterOptions();
  }, [loadFilterOptions]);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    void loadUnmappedChannelProducts();
  }, [loadUnmappedChannelProducts]);

  // Mirrors the calculator's derived values into Desconto/Comissão live, as
  // the user types — the whole point of the calculator is to skip doing this
  // math by hand, not to require a second step to bring it into the form.
  // Guarded to a no-op while both calculator fields are untouched (0), so it
  // doesn't stomp on values typed directly into Desconto/Comissão instead.
  // Self-contained (recomputes off `open` rather than reading the later
  // isOpen/calcCommissionPercent consts) so it can sit with the other hooks,
  // ahead of the early "no active store" return below.
  useEffect(() => {
    const stillOpen = composingNew || open?.status === "ABERTA";
    if (!stillOpen) return;
    if (calcDiscount === 0 && calcNetReceived === 0) return;
    const subtotal = open?.itemsSubtotal ?? 0;
    const total = Math.max(0, round2(subtotal - calcDiscount));
    const commissionAmount = Math.max(0, round2(total - calcNetReceived));
    const commissionPercent =
      total > 0 ? round2((commissionAmount / total) * 100) : 0;
    setDiscountMode("VALOR");
    setDiscount(calcDiscount);
    setCommission(commissionPercent);
  }, [calcDiscount, calcNetReceived, composingNew, open]);

  function syncHeader(order: SalesOrder) {
    setIdCustomer(order.idCustomer ?? null);
    setCustomerName(order.customerName ?? "");
    setOrderDate(order.orderDate.slice(0, 10));
    setDiscount(order.discountAmount ?? 0);
    setDiscountMode(order.discountMode ?? "VALOR");
    setDiscountPercent(order.discountPercent ?? 0);
    setChannel(order.salesChannel);
    setCommission(order.commissionPercent ?? 0);
    setCalcDiscount(0);
    setCalcNetReceived(0);
  }

  async function refreshOpen(idSalesOrder: string) {
    if (!activeStoreId) return;
    const fresh = await track(fetchSalesOrderById(activeStoreId, idSalesOrder));
    setOpen(fresh);
    syncHeader(fresh);
    setItemProduct("");
    setItemQty(0);
    setItemPrice(0);
    setStaged([]);
  }

  // Confirming a sale is what debits stock (SAIDA_VENDA), and that movement
  // carries the average product cost at that exact moment — the only place
  // the real cost-of-goods for this sale is recorded. Reading it back here
  // is what lets the statement show real margin instead of a guess based on
  // today's (possibly very different) average cost.
  async function openStatement(order: SalesOrder) {
    setStatementOrder(order);
    if (!activeStoreId) return;
    setStatementLoading(true);
    try {
      const result = await fetchStockMovements({
        idStore: activeStoreId,
        sourceId: order.idSalesOrder,
        limit: 100,
      });
      setStatementMovements(result.items);
    } catch (error) {
      showError(
        "Erro ao carregar o extrato",
        error instanceof Error ? error.message : "Tente novamente.",
      );
      setStatementMovements([]);
    } finally {
      setStatementLoading(false);
    }
  }

  function closeStatement() {
    setStatementOrder(null);
    setStatementMovements([]);
  }

  // Only sellable products that actually have stock can be sold — selling
  // more than is on hand is a hard error on the backend anyway.
  const sellableProducts = useMemo(
    () =>
      products.filter(
        (product) => (stockByProduct.get(product.idProduct) ?? 0) > 0,
      ),
    [products, stockByProduct],
  );

  // Products already on the sale, or already staged, are hidden from the
  // picker — one product, one line (same rule Compras/Receitas/Lista de
  // Compras use).
  const availableProducts = useMemo(() => {
    const taken = new Set((open?.items ?? []).map((item) => item.idProduct));
    for (const row of staged) taken.add(row.idProduct);
    return sellableProducts.filter((product) => !taken.has(product.idProduct));
  }, [sellableProducts, open, staged]);

  // Opens the form only; nothing is persisted until the staged list is saved.
  function handleNew() {
    setOpen(null);
    setComposingNew(true);
    setIdCustomer(null);
    setCustomerName("");
    setOrderDate("");
    setDiscount(0);
    setDiscountMode("VALOR");
    setDiscountPercent(0);
    setChannel("BALCAO");
    setCommission(0);
    setCalcDiscount(0);
    setCalcNetReceived(0);
    setItemProduct("");
    setItemQty(0);
    setItemPrice(0);
    setStaged([]);
  }

  function closeDrawer() {
    setOpen(null);
    setComposingNew(false);
    setStaged([]);
    void loadList();
    void loadFilterOptions();
  }

  // `next` lets a field persist its just-picked value immediately, without
  // waiting for the state update to flush (needed for the R$/% selector and
  // the calculator's "Aplicar", neither of which fires a blur event).
  async function saveHeader(next?: {
    idCustomer?: string | null;
    discountMode?: SalesDiscountMode;
    discountPercent?: number;
    discount?: number;
    commission?: number;
  }) {
    if (!activeStoreId || !open) return;
    try {
      const updated = await updateSalesOrderHeader({
        idStore: activeStoreId,
        idSalesOrder: open.idSalesOrder,
        idCustomer:
          next?.idCustomer !== undefined ? next.idCustomer : idCustomer,
        discountAmount: next?.discount ?? discount,
        discountMode: next?.discountMode ?? discountMode,
        discountPercent: next?.discountPercent ?? discountPercent,
        salesChannel: channel,
        commissionPercent: next?.commission ?? commission,
      });
      setOpen(updated);
    } catch (error) {
      showError(
        "Erro ao salvar",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    }
  }

  // Kept separate from `saveHeader`: the backend still accepts a date
  // correction after the sale is confirmed, but rejects any of the other
  // header fields at that point — sending them all together (unchanged or
  // not) would get the whole request locked out.
  async function saveOrderDate() {
    if (!activeStoreId || !open) return;
    try {
      const updated = await updateSalesOrderHeader({
        idStore: activeStoreId,
        idSalesOrder: open.idSalesOrder,
        orderDate: orderDate || undefined,
      });
      setOpen(updated);
    } catch (error) {
      showError(
        "Erro ao salvar a data",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    }
  }

  // Same reasoning as `saveOrderDate`: after confirmation the channel is a
  // correctable label, but it has to travel alone in the request.
  async function saveChannel(next: SalesChannel) {
    if (!activeStoreId || !open) return;
    try {
      const updated = await updateSalesOrderHeader({
        idStore: activeStoreId,
        idSalesOrder: open.idSalesOrder,
        salesChannel: next,
      });
      setOpen(updated);
    } catch (error) {
      setChannel(open.salesChannel);
      showError(
        "Erro ao salvar o canal",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    }
  }

  function handleDiscountModeChange(mode: SalesDiscountMode) {
    setDiscountMode(mode);
    if (open) void saveHeader({ discountMode: mode });
  }

  function handleCustomerChange(nextIdCustomer: string) {
    const value = nextIdCustomer || null;
    setIdCustomer(value);
    setCustomerName(customers.find((c) => c.idCustomer === value)?.name ?? "");
    if (open) void saveHeader({ idCustomer: value });
  }

  async function handleCreateCustomer() {
    if (!activeStoreId || savingCustomer) return;
    const name = customerForm.name.trim();
    if (!name) return;
    setSavingCustomer(true);
    try {
      const created = await createCustomer({
        idStore: activeStoreId,
        name,
        phone: customerForm.phone.trim() || undefined,
        email: customerForm.email.trim() || undefined,
        address: customerForm.address.trim() || undefined,
        notes: customerForm.notes.trim() || undefined,
      });
      await loadCustomers();
      handleCustomerChange(created.idCustomer);
      setCustomerModalOpen(false);
      setCustomerForm(emptyCustomerForm);
      showSuccess("Cliente cadastrado", `"${created.name}" foi adicionado.`);
    } catch (error) {
      showError(
        "Erro ao cadastrar cliente",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    } finally {
      setSavingCustomer(false);
    }
  }

  function unmappedRowKey(row: UnmappedChannelProduct): string {
    return `${row.channel}:${row.externalProductId}`;
  }

  async function handleMapChannelProduct(row: UnmappedChannelProduct) {
    if (!activeStoreId) return;
    const key = unmappedRowKey(row);
    const idProduct = mappingChoice[key];
    if (!idProduct || savingMappingKey) return;

    setSavingMappingKey(key);
    try {
      const result = await mapChannelProduct({
        idStore: activeStoreId,
        channel: row.channel,
        externalProductId: row.externalProductId,
        externalProductName: row.externalProductName,
        idProduct,
      });
      setMappingChoice((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      showSuccess(
        "Produto mapeado",
        result.promotedOrders > 0
          ? `${result.promotedOrders} pedido(s) criado(s) como venda.`
          : "",
      );
      await Promise.all([loadUnmappedChannelProducts(), loadList()]);
    } catch (error) {
      showError(
        "Erro ao mapear produto",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    } finally {
      setSavingMappingKey(null);
    }
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
  const stagedToSave =
    staged.length + (itemProduct && itemQty > 0 && !exceedsStock ? 1 : 0);

  // Pure client-side — stages the currently-typed line so several products
  // can pile up before a single "Adicionar" round-trip (see handleSaveStaged).
  function handleAddToList() {
    if (!itemProduct) return;
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
    setStaged((prev) => [
      ...prev,
      {
        key: `${itemProduct}-${Date.now()}-${prev.length}`,
        idProduct: itemProduct,
        quantity: itemQty,
        unitPrice: itemPrice,
      },
    ]);
    setItemProduct("");
    setItemQty(0);
    setItemPrice(0);
  }

  function handleRemoveStaged(key: string) {
    setStaged((prev) => prev.filter((row) => row.key !== key));
  }

  // Commits the whole staged list in one call — creates the sale first if
  // this is the first save (same as before), then a single bulk addItems
  // instead of one addItem round-trip per product.
  async function handleSaveStaged() {
    if (busy) return;
    // Fold a filled-but-not-yet-staged row into the batch so the user never
    // loses what they just typed.
    const items = [
      ...staged.map((row) => ({
        idProduct: row.idProduct,
        quantity: row.quantity,
        unitPrice: row.unitPrice > 0 ? row.unitPrice : undefined,
      })),
      ...(itemProduct && itemQty > 0 && !exceedsStock
        ? [
            {
              idProduct: itemProduct,
              quantity: itemQty,
              unitPrice: itemPrice > 0 ? itemPrice : undefined,
            },
          ]
        : []),
    ];
    if (items.length === 0 || !activeStoreId) return;
    setBusy(true);
    try {
      let idSalesOrder = open?.idSalesOrder;
      // First save of a new sale: create the record now and carry over any
      // header fields that were already typed.
      if (!idSalesOrder) {
        const created = await createSalesOrder({
          idStore: activeStoreId,
          orderDate: orderDate || undefined,
        });
        idSalesOrder = created.idSalesOrder;
        if (
          idCustomer ||
          discount > 0 ||
          discountPercent > 0 ||
          channel !== "BALCAO" ||
          commission > 0
        ) {
          await updateSalesOrderHeader({
            idStore: activeStoreId,
            idSalesOrder,
            idCustomer,
            discountAmount: discount,
            discountMode,
            discountPercent,
            salesChannel: channel,
            commissionPercent: commission,
          });
        }
      }
      const updated = await addSalesOrderItems({
        idStore: activeStoreId,
        idSalesOrder,
        items,
      });
      setOpen(updated);
      setComposingNew(false);
      syncHeader(updated);
      setStaged([]);
      setItemProduct("");
      setItemQty(0);
      setItemPrice(0);
      showSuccess(
        `${items.length} ${items.length > 1 ? "itens adicionados" : "item adicionado"}`,
        "",
      );
    } catch (error) {
      showError(
        "Erro ao adicionar itens",
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
  // The sale date and channel stay correctable after confirmation — every
  // other header field locks. Only a cancelled order is fully read-only.
  const canEditDate = composingNew || open?.status !== "CANCELADA";

  // While the sale is editable, the discount / total follow the fields being
  // typed; once confirmed they show the frozen values.
  const subtotalShown = open?.itemsSubtotal ?? 0;
  const discountShown = isOpen
    ? discountMode === "PERCENTUAL"
      ? round2(subtotalShown * (discountPercent / 100))
      : discount
    : (open?.discountAmount ?? 0);
  const totalShown = Math.max(0, subtotalShown - discountShown);
  const channelShown = isOpen ? channel : (open?.salesChannel ?? channel);
  const commissionPercentShown = isOpen
    ? commission
    : (open?.commissionPercent ?? 0);
  const commissionAmountShown = isOpen
    ? round2(totalShown * (commissionPercentShown / 100))
    : (open?.commissionAmount ?? 0);
  const netTotalShown = isOpen
    ? Math.max(0, round2(totalShown - commissionAmountShown))
    : (open?.netTotal ?? 0);

  // What a full-price statement calls "total" once the platform's own promo
  // discount is taken out — the commission % the platform actually charged
  // is back-solved from the gap between that and what it deposited.
  const calcTotal = Math.max(0, round2(subtotalShown - calcDiscount));
  const calcCommissionAmount = Math.max(0, round2(calcTotal - calcNetReceived));
  const calcCommissionPercent =
    calcTotal > 0 ? round2((calcCommissionAmount / calcTotal) * 100) : 0;

  // Read-only detail panel shown when a confirmed sale's row is expanded.
  function renderSaleDetails(order: SalesOrder) {
    const info: [string, ReactNode][] = [
      ["Cliente", order.customerName ?? "—"],
      ["Canal", salesChannelLabel[order.salesChannel]],
      ["Data do pedido", formatDateOnlyDisplay(order.orderDate)],
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

  const productKindLabel: Record<string, string> = {
    PRODUTO_FINAL: "Receita",
    REVENDA: "Revenda",
    INSUMO: "Insumo",
    INTERMEDIARIO: "Intermediário",
  };
  const productKindTone: Record<string, "info" | "gold" | "neutral"> = {
    PRODUTO_FINAL: "info",
    REVENDA: "gold",
  };

  // Full profit/margin statement for a confirmed sale, opened from the
  // "Extrato" icon. Confirming a sale debits stock (SAIDA_VENDA), and that
  // movement snapshots the product's average cost at that exact moment —
  // the only place the real cost-of-goods for this sale lives, for both
  // recipe-made items (PRODUTO_FINAL) and resale items (REVENDA). Reading
  // it back here is what makes the margin numbers reflect what actually
  // happened, not today's (possibly very different) average cost.
  function renderStatement() {
    const order = statementOrder;
    if (!order) return null;

    const costByProduct = new Map(
      statementMovements
        .filter((movement) => movement.type === "SAIDA_VENDA")
        .map((movement) => [movement.idProduct, movement.unitCost]),
    );

    const lines = order.items.map((item) => {
      const unitCost = costByProduct.get(item.idProduct);
      const hasCost = unitCost != null;
      const lineCost = hasCost ? unitCost * item.quantity : null;
      const lineProfit = hasCost ? item.lineTotal - lineCost! : null;
      const lineMarginPct =
        lineProfit != null && item.lineTotal > 0
          ? (lineProfit / item.lineTotal) * 100
          : null;
      return { item, unitCost, lineCost, lineProfit, lineMarginPct, hasCost };
    });

    const allCostsKnown = lines.length > 0 && lines.every((l) => l.hasCost);
    const totalCost = allCostsKnown
      ? lines.reduce((sum, l) => sum + (l.lineCost ?? 0), 0)
      : null;
    const grossProfit = totalCost != null ? order.total - totalCost : null;
    const grossMarginPct =
      grossProfit != null && order.total > 0
        ? (grossProfit / order.total) * 100
        : null;
    const netProfit = totalCost != null ? order.netTotal - totalCost : null;
    const netMarginPct =
      netProfit != null && order.netTotal > 0
        ? (netProfit / order.netTotal) * 100
        : null;
    const netVsGrossDiff = order.total - order.netTotal;
    const hasCommission =
      order.commissionAmount > 0 || order.commissionPercent > 0;

    const info: [string, ReactNode][] = [
      ["Cliente", order.customerName ?? "—"],
      ["Canal", salesChannelLabel[order.salesChannel]],
      ["Data do pedido", formatDateOnlyDisplay(order.orderDate)],
      ["Criado por", order.createdByUserName ?? "—"],
      ["Criado em", formatDateTimeDisplay(order.createdAt)],
      [
        "Confirmado em",
        order.confirmedAt ? formatDateTimeDisplay(order.confirmedAt) : "—",
      ],
    ];

    const financials: {
      label: string;
      value: string;
      emphasis?: boolean;
      negative?: boolean;
    }[] = [
      { label: "Subtotal (bruto)", value: brl(order.itemsSubtotal) },
      {
        label:
          order.discountMode === "PERCENTUAL"
            ? `Desconto (${order.discountPercent}%)`
            : "Desconto",
        value: `− ${brl(order.discountAmount)}`,
      },
      {
        label: "Total (após desconto)",
        value: brl(order.total),
        emphasis: true,
      },
    ];
    if (hasCommission) {
      financials.push({
        label: `Comissão ${salesChannelLabel[order.salesChannel]} (${order.commissionPercent.toFixed(2)}%)`,
        value: `− ${brl(order.commissionAmount)}`,
      });
      financials.push({
        label: "Total líquido",
        value: brl(order.netTotal),
        emphasis: true,
      });
      financials.push({
        label: "Diferença líquido × bruto",
        value: `− ${brl(netVsGrossDiff)}`,
      });
    }
    financials.push({
      label: "Custo dos produtos (CMV)",
      value: totalCost != null ? brl(totalCost) : "indisponível",
    });
    financials.push({
      label: "Lucro bruto (antes da comissão)",
      value: grossProfit != null ? brl(grossProfit) : "—",
      negative: grossProfit != null && grossProfit < 0,
    });
    financials.push({
      label: "Margem bruta",
      value: grossMarginPct != null ? `${grossMarginPct.toFixed(1)}%` : "—",
      negative: grossMarginPct != null && grossMarginPct < 0,
    });
    if (hasCommission) {
      financials.push({
        label: "Lucro líquido (após comissão)",
        value: netProfit != null ? brl(netProfit) : "—",
        emphasis: true,
        negative: netProfit != null && netProfit < 0,
      });
      financials.push({
        label: "Margem líquida",
        value: netMarginPct != null ? `${netMarginPct.toFixed(1)}%` : "—",
        emphasis: true,
        negative: netMarginPct != null && netMarginPct < 0,
      });
    }

    const sectionHead =
      "bg-shell px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.07em] text-cream-muted";
    const th = `${sectionHead} text-left`;

    return (
      <div className="flex flex-col gap-4">
        <div className="overflow-hidden rounded-lg border border-hairline bg-card">
          <div className={sectionHead}>Detalhes da venda</div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 px-4 py-3 sm:grid-cols-3">
            {info.map(([label, value]) => (
              <div key={label} className="flex flex-col gap-0.5">
                <dt className="text-[10px] font-medium uppercase tracking-wide text-ink-subtle">
                  {label}
                </dt>
                <dd className="text-[13px] text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {statementLoading ? (
          <p className="px-1 text-[12px] text-ink-muted">Carregando custos…</p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-hairline bg-card">
              <table className="w-full text-[12px]">
                <thead>
                  <tr>
                    <th className={th}>Produto</th>
                    <th className={th}>Tipo</th>
                    <th className={`${th} text-right`}>Qtd.</th>
                    <th className={`${th} text-right`}>Venda un.</th>
                    <th className={`${th} text-right`}>Custo un.</th>
                    <th className={`${th} text-right`}>Total venda</th>
                    <th className={`${th} text-right`}>Custo total</th>
                    <th className={`${th} text-right`}>Lucro</th>
                    <th className={`${th} text-right`}>Margem</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map(
                    ({
                      item,
                      unitCost,
                      lineCost,
                      lineProfit,
                      lineMarginPct,
                      hasCost,
                    }) => (
                      <tr
                        key={item.idSalesOrderItem}
                        className="border-t border-hairline"
                      >
                        <td className="px-4 py-2 text-ink">
                          {item.productName}
                        </td>
                        <td className="px-4 py-2">
                          <Badge
                            tone={
                              productKindTone[item.productKind] ?? "neutral"
                            }
                          >
                            {productKindLabel[item.productKind] ??
                              item.productKind}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums text-ink">
                          {qtyFmt(item.quantity)}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums text-ink">
                          {brl(item.unitPrice)}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums text-ink">
                          {hasCost ? brl(unitCost as number) : "—"}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums text-ink">
                          {brl(item.lineTotal)}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums text-ink">
                          {hasCost ? brl(lineCost as number) : "—"}
                        </td>
                        <td
                          className={`px-4 py-2 text-right tabular-nums font-medium ${
                            lineProfit != null && lineProfit < 0
                              ? "text-err-fg"
                              : "text-ink"
                          }`}
                        >
                          {lineProfit != null ? brl(lineProfit) : "—"}
                        </td>
                        <td
                          className={`px-4 py-2 text-right tabular-nums font-medium ${
                            lineMarginPct != null && lineMarginPct < 0
                              ? "text-err-fg"
                              : "text-ink"
                          }`}
                        >
                          {lineMarginPct != null
                            ? `${lineMarginPct.toFixed(1)}%`
                            : "—"}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            <div className="overflow-hidden rounded-lg border border-hairline bg-card">
              <div className={sectionHead}>Resultado financeiro</div>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 px-4 py-3 text-[13px] sm:grid-cols-2">
                {financials.map((row) => (
                  <div
                    key={row.label}
                    className={`flex justify-between gap-3 ${
                      row.emphasis ? "font-semibold text-ink" : "text-ink-muted"
                    } ${row.negative ? "!text-err-fg" : ""}`}
                  >
                    <dt>{row.label}</dt>
                    <dd className="tabular-nums">{row.value}</dd>
                  </div>
                ))}
              </dl>
              {totalCost == null && (
                <p className="border-t border-hairline px-4 py-2 text-[11px] text-ink-subtle">
                  Custo indisponível para um ou mais itens — sem movimentação de
                  estoque registrada para esta venda.
                </p>
              )}
            </div>
          </>
        )}

        {order.notes && (
          <p className="rounded-lg border border-hairline bg-card px-4 py-3 text-[12px] text-ink-muted">
            <span className="font-medium text-ink">Observações: </span>
            {order.notes}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {unmappedProducts.length > 0 && (
        <SectionCard
          title="Pendências de mapeamento"
          description="Itens de pedidos vindos de canais externos (99Food, iFood…) que ainda não têm um produto interno correspondente — mapeie uma vez e todos os pedidos parados por causa dele viram venda na hora."
        >
          <div className="flex flex-col gap-3">
            {unmappedProducts.map((row) => {
              const key = unmappedRowKey(row);
              return (
                <div
                  key={key}
                  className="flex flex-col gap-3 rounded-md border border-hairline bg-card-alt px-3 py-3 sm:flex-row sm:items-end"
                >
                  <div className="flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
                      {salesChannelLabel[row.channel as SalesChannel] ??
                        row.channel}
                    </p>
                    <p className="text-[13px] font-medium text-ink">
                      {row.externalProductName}
                    </p>
                    <p className="text-[12px] text-ink-subtle">
                      {row.pendingEventCount} pedido(s) aguardando este
                      mapeamento
                    </p>
                  </div>
                  <div className="sm:w-64">
                    <Select
                      label="Produto interno"
                      value={mappingChoice[key] ?? ""}
                      onChange={(e) =>
                        setMappingChoice((prev) => ({
                          ...prev,
                          [key]: e.target.value,
                        }))
                      }
                    >
                      <option value="">Selecione</option>
                      {sellableProducts.map((product) => (
                        <option
                          key={product.idProduct}
                          value={product.idProduct}
                        >
                          {productOptionLabel(product)}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <Button
                    variant="primary"
                    loading={savingMappingKey === key}
                    disabled={!mappingChoice[key] || savingMappingKey !== null}
                    onClick={() => handleMapChannelProduct(row)}
                  >
                    Salvar
                  </Button>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

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
              onChange={(e) => patchFilters({ customer: e.target.value })}
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
              onChange={(e) => patchFilters({ channel: e.target.value })}
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
              onChange={(e) => patchFilters({ status: e.target.value })}
            >
              <option value="">Todas</option>
              <option value="ABERTA">Aberta</option>
              <option value="CONFIRMADA">Confirmada</option>
              <option value="CANCELADA">Cancelada</option>
            </Select>

            <Select
              label="Criado por"
              value={filters.createdBy}
              onChange={(e) => patchFilters({ createdBy: e.target.value })}
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
              key: "statement",
              label: "",
              className: "w-10",
              render: (row) =>
                row.status === "CONFIRMADA" ? (
                  <button
                    type="button"
                    title="Ver extrato"
                    aria-label="Ver extrato"
                    onClick={(event) => {
                      event.stopPropagation();
                      void openStatement(row);
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-ink-subtle transition-colors hover:bg-card-alt hover:text-brand-600"
                  >
                    <Receipt size={16} />
                  </button>
                ) : null,
            },
            {
              key: "orderDate",
              label: "Data",
              render: (row) => formatDateOnlyDisplay(row.orderDate),
              // Mobile card: customer as the title, the rest as the subtitle.
              mobileRender: (row) => row.customerName ?? "Sem cliente",
            },
            {
              key: "customerName",
              label: "Cliente",
              render: (row) => row.customerName ?? "—",
              mobileRender: (row) =>
                `${formatDateOnlyDisplay(row.orderDate)} · ${salesChannelLabel[row.salesChannel]} · ${brl(row.total)}`,
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
        subtitle={customerName || open?.customerName || undefined}
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
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
                      Cliente
                    </span>
                    {isOpen && canManage && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerForm(emptyCustomerForm);
                          setCustomerModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-700"
                      >
                        <Plus size={13} /> Novo cliente
                      </button>
                    )}
                  </div>
                  <Select
                    value={idCustomer ?? ""}
                    disabled={!isOpen}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                  >
                    <option value="">Sem cliente</option>
                    {idCustomer &&
                      !customers.some((c) => c.idCustomer === idCustomer) && (
                        <option value={idCustomer}>{customerName}</option>
                      )}
                    {customers.map((c) => (
                      <option key={c.idCustomer} value={c.idCustomer}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Input
                    label="Data da venda"
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    onBlur={saveOrderDate}
                    disabled={!canEditDate}
                  />
                  {!isOpen && canEditDate && (
                    <p className="mt-1 text-[11px] text-ink-subtle">
                      Ainda editável após a confirmação, sem alterar valores.
                    </p>
                  )}
                </div>
                <Select
                  label="Canal de venda"
                  value={channel}
                  onChange={(e) => {
                    const next = e.target.value as SalesChannel;
                    setChannel(next);
                    if (!isOpen && open) void saveChannel(next);
                  }}
                  onBlur={() => {
                    if (isOpen) void saveHeader();
                  }}
                  disabled={!canEditDate}
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
              <SectionCard
                title="Calculadora de desconto e comissão"
                collapsible
                defaultOpen={false}
              >
                <p className="mb-3 text-[12px] text-ink-muted">
                  Copie os dois valores direto do extrato do app (iFood, 99Food
                  etc.) — Desconto e Comissão do canal acima (e o Total/Líquido
                  no resumo abaixo) já acompanham em tempo real enquanto você
                  digita. Essa % junta tudo que o app descontou (comissão, taxa
                  de pagamento, logística) num só número, porque o sistema só
                  guarda um campo de comissão.
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <CurrencyInput
                    label="Desconto da plataforma"
                    value={calcDiscount}
                    onValueChange={setCalcDiscount}
                    onBlur={() => saveHeader()}
                    hint='"Preço dos itens sem ofertas" − "Total após descontos" no extrato. Sem promoção no pedido, deixe R$ 0,00.'
                  />
                  <CurrencyInput
                    label="Valor líquido recebido"
                    value={calcNetReceived}
                    onValueChange={setCalcNetReceived}
                    onBlur={() => saveHeader()}
                    hint='"Valor do pagamento" (ou "Ganhos com o pedido") no extrato.'
                  />
                  <div className="flex flex-col justify-end rounded-md border border-hairline bg-card-alt px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-ink-subtle">
                      Comissão calculada
                    </p>
                    <p className="text-lg font-semibold text-brand-600 tabular-nums">
                      {calcCommissionPercent.toFixed(2)}%
                    </p>
                    <p className="text-[11px] text-ink-subtle tabular-nums">
                      = {brl(calcCommissionAmount)} sobre {brl(calcTotal)}
                    </p>
                  </div>
                </div>
              </SectionCard>
            )}

            {isOpen && (
              <SectionCard title="Adicionar item">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Select
                    label="Produto"
                    value={itemProduct}
                    onChange={(e) => {
                      setItemProduct(e.target.value);
                      const prod = availableProducts.find(
                        (p) => p.idProduct === e.target.value,
                      );
                      if (prod?.salePrice != null && itemPrice === 0)
                        setItemPrice(prod.salePrice);
                    }}
                  >
                    <option value="">
                      {availableProducts.length === 0
                        ? "Nenhum produto final com estoque"
                        : "Selecione"}
                    </option>
                    {availableProducts.map((product) => (
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
                    variant="outline"
                    disabled={!itemProduct || itemQty <= 0 || exceedsStock}
                    onClick={handleAddToList}
                  >
                    Adicionar à lista
                  </Button>
                </div>

                {stagedToSave > 0 && (
                  <div className="mt-4 flex flex-col gap-3">
                    {staged.length > 0 && (
                      <ul className="flex flex-col rounded-lg border border-hairline">
                        {staged.map((row) => {
                          const product = products.find(
                            (p) => p.idProduct === row.idProduct,
                          );
                          return (
                            <li
                              key={row.key}
                              className="flex items-center justify-between gap-3 border-b border-hairline px-3 py-2 text-[13px] last:border-b-0"
                            >
                              <span className="text-ink">
                                {product
                                  ? productOptionLabel(product)
                                  : row.idProduct}
                              </span>
                              <span className="flex items-center gap-3">
                                <span className="tabular-nums text-ink-muted">
                                  {qtyFmt(row.quantity)} × {brl(row.unitPrice)}{" "}
                                  ={" "}
                                  {brl(
                                    calcSalesLineTotal(
                                      row.quantity,
                                      row.unitPrice,
                                    ),
                                  )}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="!text-err-fg hover:!bg-err-bg"
                                  onClick={() => handleRemoveStaged(row.key)}
                                >
                                  Remover
                                </Button>
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    <div>
                      <Button
                        variant="primary"
                        loading={busy}
                        disabled={busy}
                        onClick={handleSaveStaged}
                      >
                        Adicionar {stagedToSave}{" "}
                        {stagedToSave > 1 ? "itens" : "item"} à venda
                      </Button>
                    </div>
                  </div>
                )}
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
                          ({isOpen ? discountPercent : open.discountPercent}
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
                  {(commissionAmountShown > 0 ||
                    commissionPercentShown > 0) && (
                    <>
                      <div className="flex justify-between">
                        <dt className="text-ink-muted">
                          Comissão {salesChannelLabel[channelShown]} (
                          {commissionPercentShown.toFixed(2)}%)
                        </dt>
                        <dd className="tabular-nums">
                          − {brl(commissionAmountShown)}
                        </dd>
                      </div>
                      <div className="flex justify-between border-t border-hairline pt-1.5 text-[15px] font-semibold text-brand-600">
                        <dt>Total líquido</dt>
                        <dd className="tabular-nums">{brl(netTotalShown)}</dd>
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

      <Drawer
        open={!!statementOrder}
        onClose={closeStatement}
        width="xl"
        title="Extrato da venda"
        subtitle={statementOrder?.customerName ?? undefined}
      >
        {renderStatement()}
      </Drawer>

      <Modal
        open={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        width="lg"
        title="Novo cliente"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setCustomerModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              loading={savingCustomer}
              disabled={savingCustomer || !customerForm.name.trim()}
              onClick={handleCreateCustomer}
            >
              Cadastrar
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label="Nome"
              value={customerForm.name}
              autoFocus
              onChange={(e) =>
                setCustomerForm({ ...customerForm, name: e.target.value })
              }
              placeholder="Ex.: Anna Luiza"
            />
          </div>
          <Input
            label="Telefone / WhatsApp"
            inputMode="tel"
            placeholder="(00) 00000-0000"
            value={customerForm.phone}
            onChange={(e) =>
              setCustomerForm({
                ...customerForm,
                phone: formatBrazilianPhone(e.target.value),
              })
            }
          />
          <Input
            label="E-mail"
            type="email"
            value={customerForm.email}
            onChange={(e) =>
              setCustomerForm({ ...customerForm, email: e.target.value })
            }
          />
          <div className="sm:col-span-2">
            <Input
              label="Endereço"
              value={customerForm.address}
              onChange={(e) =>
                setCustomerForm({ ...customerForm, address: e.target.value })
              }
            />
          </div>
        </div>
        <p className="mt-2 text-[11px] text-ink-subtle">
          O cliente fica disponível na página <strong>Clientes</strong> e em
          todas as vendas da loja.
        </p>
      </Modal>

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
