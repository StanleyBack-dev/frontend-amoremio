import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Copy, Receipt } from "lucide-react";
import Button from "@atoms/Button";
import NumberInput from "@atoms/NumberInput";
import CurrencyInput from "@atoms/CurrencyInput";
import Input from "@atoms/Input";
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
import { fetchStoreStock } from "@/features/inventory";
import { fetchRecipes } from "@/features/recipes";
import {
  fetchProducts,
  productOptionLabel,
  RECIPE_INPUT_KINDS,
  RECIPE_OUTPUT_KINDS,
} from "@/features/catalog";
import { formatDateOnlyDisplay, formatDateTimeDisplay } from "@/utils/format";
import type { Recipe } from "@/api/recipes/schema";
import type { StockItem } from "@/api/inventory/schema";
import type { Product } from "@/api/catalog/schema";
import type {
  ListProductionOrdersParams,
  ProductionOrder,
  ProductionOrderFilterOptions,
} from "@/api/production/schema";
import {
  addProductionOrderOutput,
  addProductionOrderOutputExtra,
  cancelProductionOrder,
  completeProductionOrder,
  createProductionOrder,
  duplicateProductionOrder,
  fetchProductionOrderById,
  fetchProductionOrderFilterOptions,
  fetchProductionOrders,
  productionOrderStatusLabel,
  removeProductionOrderOutput,
  removeProductionOrderOutputExtra,
  syncProductionOrderWithRecipe,
  updateProductionOrder,
} from "@/features/production";

const brl = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const qty = (value: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(value);

// Ingredient costs show 2 decimals like everything else; only a sub-cent
// value (e.g. R$ 0,00435 per gram) gets extra decimals so it doesn't collapse
// to "R$ 0,00". Output/product costs always use brl().
const unitBrl = (value: number) => {
  if (value !== 0 && Math.abs(value) < 0.005) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(value);
  }
  return brl(value);
};

const statusTone: Record<string, "warning" | "success" | "danger"> = {
  RASCUNHO: "warning",
  CONCLUIDA: "success",
  CANCELADA: "danger",
};

function round4(value: number): number {
  return Math.round(value * 10000) / 10000;
}

const emptyFilters = { recipe: "", status: "", createdBy: "" };

type PendingConfirm =
  | { kind: "cancel" }
  | { kind: "sync" }
  | { kind: "duplicate"; order: ProductionOrder }
  | null;

interface StagingExtra {
  idProduct: string;
  quantity: number;
}

export default function Production() {
  const { showError, showSuccess } = useToast();
  const { track } = useLoading();
  const { activeStore, activeStoreId } = useStoreContext();
  const canComplete =
    activeStore?.role === "DONO" ||
    activeStore?.role === "GERENTE" ||
    activeStore?.role === null;

  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  // Candidates for the output/extra pickers — same kind rules a recipe
  // itself is held to (see RECIPE_OUTPUT_KINDS/RECIPE_INPUT_KINDS).
  const [outputProducts, setOutputProducts] = useState<Product[]>([]);
  const [extraProducts, setExtraProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState(emptyFilters);
  const [filterOptions, setFilterOptions] =
    useState<ProductionOrderFilterOptions>({ recipes: [], creators: [] });
  const {
    page: listPage,
    limit: listLimit,
    meta: listMeta,
    setPage: setListPage,
    setLimit: setListLimit,
    setMeta: setListMeta,
    reset: resetListPage,
  } = useTablePagination();

  const patchFilters = (patch: Partial<typeof emptyFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    resetListPage();
  };
  const clearFilters = () => {
    setFilters(emptyFilters);
    resetListPage();
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  const [open, setOpen] = useState<ProductionOrder | null>(null);
  const [busy, setBusy] = useState(false);
  const [statementOrder, setStatementOrder] = useState<ProductionOrder | null>(
    null,
  );

  const [createRecipeId, setCreateRecipeId] = useState("");
  const [createBatches, setCreateBatches] = useState(1);
  const [createDate, setCreateDate] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [editProductionDate, setEditProductionDate] = useState("");
  const [editBatches, setEditBatches] = useState(0);
  const [editLabor, setEditLabor] = useState(0);
  const [editOverhead, setEditOverhead] = useState(0);

  // Staging for the next output line to add — outputs/extras themselves are
  // persisted immediately (see handleAddOutput etc.), same add-to-list
  // pattern Compras/Vendas use for items, so they survive closing the
  // drawer instead of living only in local state until completion.
  const [stagingProduct, setStagingProduct] = useState("");
  const [stagingQty, setStagingQty] = useState(0);
  // One staging slot per output line, keyed by idProductionOrderOutput, for
  // that line's "insumo extra" add-to-list.
  const [extraStaging, setExtraStaging] = useState<
    Record<string, StagingExtra>
  >({});
  // Which output line's extras panel is expanded — only one at a time, so
  // the list stays scannable instead of every line's extras form piling up
  // vertically at once.
  const [expandedOutputId, setExpandedOutputId] = useState<string | null>(null);

  const [confirm, setConfirm] = useState<PendingConfirm>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  // Synchronous lock — `confirmBusy` state updates too late to block a fast
  // double-click on the confirm button.
  const confirmLock = useRef(false);

  const buildListParams = useCallback((): ListProductionOrdersParams => {
    const params: ListProductionOrdersParams = {
      idStore: activeStoreId as string,
      page: listPage,
      limit: listLimit,
    };
    if (filters.recipe) params.idRecipe = filters.recipe;
    if (filters.status) {
      params.status = filters.status as ListProductionOrdersParams["status"];
    }
    if (filters.createdBy) params.createdByUserId = filters.createdBy;
    return params;
  }, [activeStoreId, filters, listPage, listLimit]);

  const load = useCallback(async () => {
    if (!activeStoreId) {
      setOrders([]);
      return;
    }
    setLoading(true);
    try {
      const [orderResult, recipeResult, stockList, outputs, extras] =
        await Promise.all([
          fetchProductionOrders(buildListParams()),
          fetchRecipes({ idStore: activeStoreId, limit: 500, status: true }),
          fetchStoreStock({ idStore: activeStoreId, limit: 200 }),
          fetchProducts({
            idStore: activeStoreId,
            limit: 500,
            status: true,
            kinds: RECIPE_OUTPUT_KINDS,
          }),
          fetchProducts({
            idStore: activeStoreId,
            limit: 500,
            status: true,
            kinds: RECIPE_INPUT_KINDS,
          }),
        ]);
      setOrders(orderResult.items);
      setListMeta({
        total: orderResult.pagination.total,
        totalPages: orderResult.pagination.totalPages,
      });
      setRecipes(recipeResult.items);
      setStock(stockList.items);
      setOutputProducts(outputs.items);
      setExtraProducts(extras.items);
    } catch (error) {
      showError(
        "Erro ao carregar produção",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }, [activeStoreId, buildListParams, setListMeta, showError]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadFilterOptions = useCallback(async () => {
    if (!activeStoreId) {
      setFilterOptions({ recipes: [], creators: [] });
      return;
    }
    try {
      setFilterOptions(await fetchProductionOrderFilterOptions(activeStoreId));
    } catch {
      setFilterOptions({ recipes: [], creators: [] });
    }
  }, [activeStoreId]);

  useEffect(() => {
    void loadFilterOptions();
  }, [loadFilterOptions]);

  const avgCostByProduct = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of stock) map.set(item.idProduct, item.averageCost);
    return map;
  }, [stock]);

  function syncEdit(order: ProductionOrder) {
    setEditProductionDate(order.productionDate.slice(0, 10));
    setEditBatches(order.batches);
    setEditLabor(order.laborCost);
    setEditOverhead(order.overheadCost);
    setExtraStaging({});
    setExpandedOutputId(null);
    // order.outputs already carries whatever was persisted so far — the
    // staging fields here are only the suggestion for the *next* line to
    // add, pre-filled with the recipe's own product/planned quantity so the
    // common single-output case is still just one click away.
    setStagingProduct(order.status === "RASCUNHO" ? order.idOutputProduct : "");
    setStagingQty(
      order.status === "RASCUNHO"
        ? order.actualOutputQuantity || order.plannedOutputQuantity
        : 0,
    );
  }

  async function refreshOpen(idProductionOrder: string) {
    if (!activeStoreId) return;
    const fresh = await track(
      fetchProductionOrderById(activeStoreId, idProductionOrder),
    );
    setOpen(fresh);
    syncEdit(fresh);
  }

  // The list row already carries items/outputs with their frozen costs
  // (unlike a sale, a production order's own cost fields ARE the source of
  // truth — no need to re-fetch stock movements just to show the statement).
  function openStatement(order: ProductionOrder) {
    setStatementOrder(order);
  }

  function closeStatement() {
    setStatementOrder(null);
  }

  async function handleCreate() {
    if (!activeStoreId || !createRecipeId) return;
    if (createBatches <= 0) {
      showError("Nº de lotes inválido", "Informe um valor maior que zero.");
      return;
    }
    setCreating(true);
    try {
      const created = await createProductionOrder({
        idStore: activeStoreId,
        idRecipe: createRecipeId,
        batches: createBatches,
        productionDate: createDate || undefined,
      });
      setCreateOpen(false);
      setCreateRecipeId("");
      setCreateBatches(1);
      setCreateDate("");
      await Promise.all([load(), loadFilterOptions()]);
      setOpen(created);
      syncEdit(created);
    } catch (error) {
      showError(
        "Erro ao criar ordem",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function saveEdit() {
    if (!activeStoreId || !open || open.status !== "RASCUNHO") return;
    try {
      const updated = await updateProductionOrder({
        idStore: activeStoreId,
        idProductionOrder: open.idProductionOrder,
        productionDate: editProductionDate || undefined,
        batches: editBatches > 0 ? editBatches : undefined,
        laborCost: editLabor,
        overheadCost: editOverhead,
      });
      setOpen(updated);
      setEditProductionDate(updated.productionDate.slice(0, 10));
      setEditBatches(updated.batches);
      setEditLabor(updated.laborCost);
      setEditOverhead(updated.overheadCost);
    } catch (error) {
      showError(
        "Erro ao salvar",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    }
  }

  async function handleComplete() {
    if (!activeStoreId || !open) return;
    if (open.outputs.length === 0) {
      showError(
        "Informe as saídas da produção",
        "Adicione ao menos um produto de saída antes de concluir.",
      );
      return;
    }
    setBusy(true);
    try {
      const done = await completeProductionOrder(
        activeStoreId,
        open.idProductionOrder,
      );
      showSuccess(
        "Produção concluída",
        "Ingredientes baixados e produtos gerados no estoque.",
      );
      setOpen(done);
      setExtraStaging({});
      setStagingProduct("");
      setStagingQty(0);
      await load();
    } catch (error) {
      showError(
        "Erro ao concluir",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }

  // Commits the staging product/quantity as a new output line — same
  // add-to-list pattern as "Adicionar item" in Compras/Vendas, persisted
  // right away so it survives closing the drawer.
  async function handleAddOutput() {
    if (!activeStoreId || !open || !stagingProduct || stagingQty <= 0) return;
    setBusy(true);
    try {
      const updated = await addProductionOrderOutput(
        activeStoreId,
        open.idProductionOrder,
        stagingProduct,
        stagingQty,
      );
      setOpen(updated);
      // Expand the line just added — it's the one the user most likely wants
      // to attach an "insumo extra" to next.
      const newOutput = updated.outputs.find(
        (output) => output.idProduct === stagingProduct,
      );
      setExpandedOutputId(newOutput?.idProductionOrderOutput ?? null);
      setStagingProduct("");
      setStagingQty(0);
    } catch (error) {
      showError(
        "Erro ao adicionar saída",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveOutput(idProductionOrderOutput: string) {
    if (!activeStoreId || !open) return;
    setBusy(true);
    try {
      const updated = await removeProductionOrderOutput(
        activeStoreId,
        open.idProductionOrder,
        idProductionOrderOutput,
      );
      setOpen(updated);
      setExtraStaging((prev) => {
        const next = { ...prev };
        delete next[idProductionOrderOutput];
        return next;
      });
      setExpandedOutputId((prev) =>
        prev === idProductionOrderOutput ? null : prev,
      );
    } catch (error) {
      showError(
        "Erro ao remover saída",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }

  function updateExtraStaging(
    idProductionOrderOutput: string,
    patch: Partial<StagingExtra>,
  ) {
    setExtraStaging((prev) => ({
      ...prev,
      [idProductionOrderOutput]: {
        ...(prev[idProductionOrderOutput] ?? { idProduct: "", quantity: 0 }),
        ...patch,
      },
    }));
  }

  // Commits that line's staged extra into its extras list — same
  // add-to-list pattern, one level down.
  async function handleAddExtra(idProductionOrderOutput: string) {
    if (!activeStoreId || !open) return;
    const staging = extraStaging[idProductionOrderOutput];
    if (!staging?.idProduct || staging.quantity <= 0) return;
    setBusy(true);
    try {
      const updated = await addProductionOrderOutputExtra(
        activeStoreId,
        open.idProductionOrder,
        idProductionOrderOutput,
        staging.idProduct,
        staging.quantity,
      );
      setOpen(updated);
      setExtraStaging((prev) => ({
        ...prev,
        [idProductionOrderOutput]: { idProduct: "", quantity: 0 },
      }));
    } catch (error) {
      showError(
        "Erro ao adicionar insumo extra",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveExtra(
    idProductionOrderOutput: string,
    idProductionOrderOutputExtra: string,
  ) {
    if (!activeStoreId || !open) return;
    setBusy(true);
    try {
      const updated = await removeProductionOrderOutputExtra(
        activeStoreId,
        open.idProductionOrder,
        idProductionOrderOutput,
        idProductionOrderOutputExtra,
      );
      setOpen(updated);
    } catch (error) {
      showError(
        "Erro ao remover insumo extra",
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
      await cancelProductionOrder(activeStoreId, open.idProductionOrder);
      showSuccess("Ordem cancelada", "");
      setOpen(null);
      await load();
    } catch (error) {
      showError(
        "Erro ao cancelar",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }

  // Re-pulls the recipe's current items into this draft — for when the
  // recipe was edited (ingredient added/removed/quantity changed) after this
  // order was created, and the change never reached the cost preview here.
  async function handleSync() {
    if (!activeStoreId || !open || open.status !== "RASCUNHO") return;
    setBusy(true);
    try {
      const synced = await syncProductionOrderWithRecipe(
        activeStoreId,
        open.idProductionOrder,
      );
      showSuccess(
        "Produção sincronizada",
        "Os insumos foram recalculados a partir da receita atual.",
      );
      setOpen(synced);
      syncEdit(synced);
    } catch (error) {
      showError(
        "Erro ao sincronizar",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }

  // Recreates the same recipe/lotes/mão de obra/saídas (+ extras) as a new
  // draft, so producing the same thing again doesn't mean retyping
  // everything from scratch — just adjust what's different and conclude.
  async function handleDuplicate(order: ProductionOrder) {
    if (!activeStoreId) return;
    setBusy(true);
    try {
      const duplicated = await duplicateProductionOrder(
        activeStoreId,
        order.idProductionOrder,
      );
      showSuccess(
        "Produção duplicada",
        "Revise a data, os lotes e as saídas antes de concluir.",
      );
      await load();
      setOpen(duplicated);
      syncEdit(duplicated);
    } catch (error) {
      showError(
        "Erro ao duplicar produção",
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
      if (confirm.kind === "cancel") {
        await handleCancel();
      } else if (confirm.kind === "sync") {
        await handleSync();
      } else {
        await handleDuplicate(confirm.order);
      }
      setConfirm(null);
    } finally {
      confirmLock.current = false;
      setConfirmBusy(false);
    }
  }

  // Live preview of the input cost while the order is a draft. For a draft the
  // consumption scales with the number of batches typed in the form (before it
  // is persisted), so the numbers move as the user types instead of waiting for
  // the server round-trip. The stored item quantities are batches × per-batch,
  // so per-batch = item.quantity / open.batches.
  const preview = useMemo(() => {
    if (!open) return null;
    const isRascunho = open.status === "RASCUNHO";
    const batchScale =
      isRascunho && open.batches > 0 && editBatches > 0
        ? editBatches / open.batches
        : 1;

    const lines = open.items.map((item) => {
      const quantity = isRascunho
        ? round4(item.quantity * batchScale)
        : item.quantity;
      const unitCost = isRascunho
        ? (avgCostByProduct.get(item.idProduct) ?? 0)
        : item.unitCostAtConsumption;
      return {
        ...item,
        quantity,
        unitCost,
        lineCost: isRascunho ? round4(quantity * unitCost) : item.lineCost,
      };
    });
    const inputsCost = round4(
      lines.reduce((sum, line) => sum + line.lineCost, 0),
    );
    const totalCost = isRascunho
      ? round4(inputsCost + editLabor + editOverhead)
      : open.totalCost;
    const plannedQty = isRascunho
      ? round4(open.plannedOutputQuantity * batchScale)
      : open.plannedOutputQuantity;
    const draftOutputQty = round4(
      open.outputs.reduce((sum, output) => sum + (output.quantity || 0), 0),
    );
    const outputQty = isRascunho
      ? draftOutputQty || plannedQty
      : open.actualOutputQuantity;
    const unitCost = outputQty > 0 ? round4(totalCost / outputQty) : 0;
    return { lines, inputsCost, totalCost, unitCost, outputQty, plannedQty };
  }, [open, avgCostByProduct, editBatches, editLabor, editOverhead]);

  // Per-line preview while drafting: the blended base cost (preview.unitCost)
  // applies to every unit, plus whatever extras that specific line adds —
  // exactly the split the backend will freeze at completion. Once concluded,
  // the frozen unitCostAtConsumption/lineCost/unitCost from the server are
  // used as-is instead of being recomputed from today's average stock cost,
  // which would misrepresent history as stock costs drift over time.
  const outputLinePreview = useMemo(() => {
    if (!preview || !open) return [];
    const isRascunho = open.status === "RASCUNHO";
    return open.outputs.map((output) => {
      const extraLines = output.extras.map((extra) => {
        const unitCost = isRascunho
          ? (avgCostByProduct.get(extra.idProduct) ?? 0)
          : extra.unitCostAtConsumption;
        const lineCost = isRascunho
          ? round4((extra.quantity || 0) * unitCost)
          : extra.lineCost;
        return { ...extra, unitCost, lineCost };
      });
      const extrasCost = extraLines.reduce(
        (sum, extra) => sum + extra.lineCost,
        0,
      );
      const quantity = output.quantity || 0;
      const totalLineCost = isRascunho
        ? round4(quantity * preview.unitCost + extrasCost)
        : round4(quantity * output.unitCost);
      const unitCost = isRascunho
        ? quantity > 0
          ? round4(totalLineCost / quantity)
          : 0
        : output.unitCost;
      return { ...output, extraLines, extrasCost, totalLineCost, unitCost };
    });
  }, [open, preview, avgCostByProduct]);

  // "Insumos a consumir" lists everything that will actually leave stock at
  // completion — the recipe's shared inputs plus every output line's own
  // extras, which are just as real a SAIDA_PRODUCAO as the shared ones.
  const insumosPreviewRows = useMemo(() => {
    if (!preview) return [];
    const sharedRows = preview.lines.map((line) => ({
      key: `item-${line.idProductionOrderItem}`,
      productName: line.productName,
      quantity: line.quantity,
      unit: line.unit,
      unitCost: line.unitCost,
      lineCost: line.lineCost,
    }));
    const extraRows = outputLinePreview.flatMap((line) =>
      line.extraLines.map((extra) => ({
        key: `extra-${extra.idProductionOrderOutputExtra}`,
        productName: `${extra.productName} (extra · ${line.productName})`,
        quantity: extra.quantity,
        unit:
          extraProducts.find((product) => product.idProduct === extra.idProduct)
            ?.unit ?? "UN",
        unitCost: extra.unitCost,
        lineCost: extra.lineCost,
      })),
    );
    return [...sharedRows, ...extraRows];
  }, [preview, outputLinePreview, extraProducts]);

  // The batch's shared cost (preview.totalCost) plus every line's own
  // extras — the true total, and what "Concluir produção" will freeze as
  // the order's totalCost. preview.totalCost/unitCost stay extras-free
  // internally while drafting (they're the blended base rate each line
  // starts from) — once concluded, preview.totalCost is already open.
  // totalCost, which already has the extras baked in, so they must not be
  // added again here.
  const totalExtrasCost = useMemo(
    () => outputLinePreview.reduce((sum, line) => sum + line.extrasCost, 0),
    [outputLinePreview],
  );
  const grandTotalCost = preview
    ? round4(
        preview.totalCost + (open?.status === "RASCUNHO" ? totalExtrasCost : 0),
      )
    : 0;
  const grandUnitCost =
    preview && preview.outputQty > 0
      ? round4(grandTotalCost / preview.outputQty)
      : 0;

  // Already-added output lines drop out of their own picker — one line per
  // product, same rule Compras/Vendas/Receitas use, so the same product
  // can't be split across two separate lines by accident.
  const takenOutputProducts = new Set(
    (open?.outputs ?? []).map((output) => output.idProduct),
  );
  const availableOutputProducts = outputProducts.filter(
    (product) => !takenOutputProducts.has(product.idProduct),
  );

  // Read-only "receipt" for a concluded order — a single consolidated view
  // of what the drawer otherwise spreads across three editable-looking
  // cards, built straight from the order's own frozen cost fields (no extra
  // fetch needed: unlike a sale, the production order already carries its
  // final cost as of completion).
  function renderProductionStatement() {
    const order = statementOrder;
    if (!order) return null;

    const insumoRows = [
      ...order.items.map((item) => ({
        key: `item-${item.idProductionOrderItem}`,
        productName: item.productName,
        origin: null as string | null,
        quantity: item.quantity,
        unit: item.unit,
        unitCost: item.unitCostAtConsumption,
        lineCost: item.lineCost,
      })),
      ...order.outputs.flatMap((output) =>
        output.extras.map((extra) => ({
          key: `extra-${extra.idProductionOrderOutputExtra}`,
          productName: extra.productName,
          origin: output.productName as string | null,
          quantity: extra.quantity,
          unit:
            extraProducts.find(
              (product) => product.idProduct === extra.idProduct,
            )?.unit ?? "UN",
          unitCost: extra.unitCostAtConsumption,
          lineCost: extra.lineCost,
        })),
      ),
    ];
    const totalExtrasCost = insumoRows
      .filter((row) => row.origin)
      .reduce((sum, row) => sum + row.lineCost, 0);
    const trueUnitCost =
      order.actualOutputQuantity > 0
        ? order.totalCost / order.actualOutputQuantity
        : 0;

    const info: [string, string][] = [
      ["Receita", order.recipeName],
      ["Data da produção", formatDateOnlyDisplay(order.productionDate)],
      ["Lotes", qty(order.batches)],
      [
        "Rendimento",
        `${qty(order.actualOutputQuantity)} de ${qty(order.plannedOutputQuantity)} planejado`,
      ],
      ["Criado por", order.createdByUserName ?? "—"],
      ["Criado em", formatDateTimeDisplay(order.createdAt)],
      [
        "Concluído em",
        order.concludedAt ? formatDateTimeDisplay(order.concludedAt) : "—",
      ],
    ];

    const sectionHead =
      "bg-shell px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.07em] text-cream-muted";
    const th = `${sectionHead} text-left`;

    return (
      <div className="flex flex-col gap-4">
        <div className="overflow-hidden rounded-lg border border-hairline bg-card">
          <div className={sectionHead}>Detalhes da produção</div>
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

        <div className="overflow-x-auto rounded-lg border border-hairline bg-card">
          <table className="w-full text-[12px]">
            <thead>
              <tr>
                <th className={th}>Insumo</th>
                <th className={th}>Origem</th>
                <th className={`${th} text-right`}>Qtd.</th>
                <th className={`${th} text-right`}>Custo un.</th>
                <th className={`${th} text-right`}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {insumoRows.map((row) => (
                <tr key={row.key} className="border-t border-hairline">
                  <td className="px-4 py-2 text-ink">{row.productName}</td>
                  <td className="px-4 py-2 text-ink-muted">
                    {row.origin ? `extra · ${row.origin}` : "compartilhado"}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-ink">
                    {qty(row.quantity)} {row.unit}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-ink">
                    {unitBrl(row.unitCost)}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-ink">
                    {brl(row.lineCost)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto rounded-lg border border-hairline bg-card">
          <table className="w-full text-[12px]">
            <thead>
              <tr>
                <th className={th}>Produto gerado</th>
                <th className={`${th} text-right`}>Qtd.</th>
                <th className={`${th} text-right`}>Custo un.</th>
                <th className={`${th} text-right`}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.outputs.map((output) => (
                <tr
                  key={output.idProductionOrderOutput}
                  className="border-t border-hairline"
                >
                  <td className="px-4 py-2 text-ink">{output.productName}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-ink">
                    {qty(output.quantity)}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-ink">
                    {unitBrl(output.unitCost)}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-ink">
                    {brl(output.quantity * output.unitCost)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="overflow-hidden rounded-lg border border-hairline bg-card">
          <div className={sectionHead}>Resultado</div>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 px-4 py-3 text-[13px] sm:grid-cols-2">
            <div className="flex justify-between gap-3 text-ink-muted">
              <dt>Custo dos insumos</dt>
              <dd className="tabular-nums">{brl(order.inputsCost)}</dd>
            </div>
            <div className="flex justify-between gap-3 text-ink-muted">
              <dt>Mão de obra + outros custos</dt>
              <dd className="tabular-nums">
                {brl(order.laborCost + order.overheadCost)}
              </dd>
            </div>
            {totalExtrasCost > 0 && (
              <div className="flex justify-between gap-3 text-ink-muted">
                <dt>Insumos extras</dt>
                <dd className="tabular-nums">{brl(totalExtrasCost)}</dd>
              </div>
            )}
            <div className="flex justify-between gap-3 font-semibold text-ink">
              <dt>Custo total</dt>
              <dd className="tabular-nums">{brl(order.totalCost)}</dd>
            </div>
            <div className="flex justify-between gap-3 font-semibold text-brand-600">
              <dt>
                Custo médio por unidade ({qty(order.actualOutputQuantity)} un.)
              </dt>
              <dd className="tabular-nums">{brl(trueUnitCost)}</dd>
            </div>
          </dl>
        </div>

        {order.notes && (
          <p className="rounded-lg border border-hairline bg-card px-4 py-3 text-[12px] text-ink-muted">
            <span className="font-medium text-ink">Observações: </span>
            {order.notes}
          </p>
        )}
      </div>
    );
  }

  if (!activeStoreId) {
    return (
      <div className="flex flex-col gap-6">
        <SectionCard title="Nenhuma loja ativa">
          <p className="text-[13px] text-ink-muted">
            Selecione uma loja em <strong className="text-ink">Lojas</strong>{" "}
            para registrar produção.
          </p>
        </SectionCard>
      </div>
    );
  }

  const isDraft = open?.status === "RASCUNHO";

  return (
    <div className="flex flex-col gap-6">
      <SectionCard
        title="Ordens de produção"
        action={
          <Button
            variant="primary"
            disabled={recipes.length === 0}
            onClick={() => setCreateOpen(true)}
          >
            Nova produção
          </Button>
        }
      >
        {recipes.length === 0 && (
          <p className="mb-3 text-[13px] text-ink-muted">
            Crie uma ficha técnica ativa em{" "}
            <strong className="text-ink">Receitas</strong> para registrar uma
            produção.
          </p>
        )}

        <FilterPanel hasActiveFilters={hasActiveFilters}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Select
              label="Receita"
              value={filters.recipe}
              onChange={(e) => patchFilters({ recipe: e.target.value })}
            >
              <option value="">Todas</option>
              {filterOptions.recipes.map((recipe) => (
                <option key={recipe.id} value={recipe.id}>
                  {recipe.name}
                </option>
              ))}
            </Select>

            <Select
              label="Situação"
              value={filters.status}
              onChange={(e) => patchFilters({ status: e.target.value })}
            >
              <option value="">Todas</option>
              <option value="RASCUNHO">Rascunho</option>
              <option value="CONCLUIDA">Concluída</option>
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

            <div className="flex items-end justify-end">
              <Button
                type="button"
                variant="secondary"
                className="w-full"
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
          getId={(row) => row.idProductionOrder}
          emptyMessage={
            loading
              ? "Carregando..."
              : hasActiveFilters
                ? "Nenhuma produção para os filtros aplicados."
                : "Nenhuma produção registrada."
          }
          onView={(row) => refreshOpen(row.idProductionOrder)}
          viewLabel="Abrir ordem"
          columns={[
            {
              key: "statement",
              label: "",
              className: "w-10",
              render: (row) =>
                row.status === "CONCLUIDA" ? (
                  <button
                    type="button"
                    title="Ver extrato"
                    aria-label="Ver extrato"
                    onClick={(event) => {
                      event.stopPropagation();
                      openStatement(row);
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-ink-subtle transition-colors hover:bg-card-alt hover:text-brand-600"
                  >
                    <Receipt size={16} />
                  </button>
                ) : null,
            },
            {
              key: "duplicate",
              label: "",
              className: "w-10",
              render: (row) => (
                <button
                  type="button"
                  title="Duplicar produção"
                  aria-label="Duplicar produção"
                  onClick={(event) => {
                    event.stopPropagation();
                    setConfirm({ kind: "duplicate", order: row });
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-ink-subtle transition-colors hover:bg-card-alt hover:text-brand-600"
                >
                  <Copy size={16} />
                </button>
              ),
            },
            {
              key: "productionDate",
              label: "Data",
              render: (row) => formatDateOnlyDisplay(row.productionDate),
            },
            { key: "recipeName", label: "Receita" },
            {
              key: "batches",
              label: "Lotes",
              className: "text-right tabular-nums",
              render: (row) => qty(row.batches),
            },
            {
              key: "actualOutputQuantity",
              label: "Produzido",
              className: "text-right tabular-nums",
              render: (row) => qty(row.actualOutputQuantity),
            },
            {
              key: "status",
              label: "Situação",
              render: (row) => (
                <Badge tone={statusTone[row.status] ?? "neutral"}>
                  {productionOrderStatusLabel[row.status]}
                </Badge>
              ),
            },
            {
              key: "totalCost",
              label: "Custo total",
              className: "text-right tabular-nums",
              render: (row) =>
                row.status === "CONCLUIDA" ? brl(row.totalCost) : "—",
            },
            {
              key: "outputUnitCost",
              label: "Custo unitário",
              className: "text-right tabular-nums",
              // row.outputUnitCost is the blended base cost shared across
              // output lines, before each line's own extras — with extras
              // in play the true per-unit average is totalCost (which does
              // include extras) over the actual quantity produced.
              render: (row) =>
                row.status === "CONCLUIDA" && row.actualOutputQuantity > 0
                  ? brl(row.totalCost / row.actualOutputQuantity)
                  : "—",
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
          disabled={loading}
          onPageChange={setListPage}
          onPageSizeChange={setListLimit}
        />
      </SectionCard>

      <Drawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Nova produção"
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              loading={creating}
              disabled={creating || !createRecipeId || createBatches <= 0}
              onClick={handleCreate}
            >
              Criar
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Select
            label="Receita"
            value={createRecipeId}
            onChange={(e) => setCreateRecipeId(e.target.value)}
          >
            <option value="">Selecione</option>
            {recipes.map((recipe) => (
              <option key={recipe.idRecipe} value={recipe.idRecipe}>
                {recipe.name} — rende {qty(recipe.yieldQuantity)}{" "}
                {recipe.yieldUnit}
              </option>
            ))}
          </Select>
          <NumberInput
            label="Nº de lotes"
            value={createBatches}
            onValueChange={setCreateBatches}
          />
          <Input
            label="Data da produção"
            type="date"
            value={createDate}
            onChange={(e) => setCreateDate(e.target.value)}
          />
        </div>
      </Drawer>

      <Drawer
        open={!!open}
        onClose={() => setOpen(null)}
        width="xl"
        title={
          open
            ? `Produção ${productionOrderStatusLabel[open.status]}`
            : "Produção"
        }
        subtitle={open?.recipeName ?? undefined}
      >
        {open && preview && (
          <div className="flex flex-col gap-5">
            <SectionCard
              title="Dados da produção"
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirm({ kind: "duplicate", order: open })}
                >
                  Duplicar produção
                </Button>
              }
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  label="Data da produção"
                  type="date"
                  value={editProductionDate}
                  onChange={(e) => setEditProductionDate(e.target.value)}
                  onBlur={saveEdit}
                  disabled={!isDraft}
                />
                <NumberInput
                  label="Nº de lotes"
                  value={editBatches}
                  onValueChange={(next) => {
                    // Keep the staged (not yet added) output quantity
                    // tracking the plan while the user hasn't overridden it,
                    // so the suggestion stays coherent as batches change.
                    // Lines already added to the list are never touched —
                    // same rule as Compras/Vendas: remove and re-add to
                    // change a committed line.
                    const perBatch =
                      open.batches > 0
                        ? open.plannedOutputQuantity / open.batches
                        : open.plannedOutputQuantity;
                    const isUntouchedDefault =
                      open.outputs.length === 0 &&
                      stagingProduct === open.idOutputProduct &&
                      Math.abs(stagingQty - perBatch * editBatches) < 0.001;
                    if (isUntouchedDefault) {
                      setStagingQty(round4(perBatch * next));
                    }
                    setEditBatches(next);
                  }}
                  onBlur={saveEdit}
                  disabled={!isDraft}
                  hint={`rendimento planejado: ${qty(preview.plannedQty)} ${open.outputProductName}`}
                />
                <CurrencyInput
                  label="Mão de obra (opcional)"
                  value={editLabor}
                  onValueChange={setEditLabor}
                  onBlur={saveEdit}
                  disabled={!isDraft}
                />
                <CurrencyInput
                  label="Outros custos (opcional)"
                  value={editOverhead}
                  onValueChange={setEditOverhead}
                  onBlur={saveEdit}
                  disabled={!isDraft}
                />
              </div>
            </SectionCard>

            <SectionCard
              title={isDraft ? "Saídas da produção" : "Produtos gerados"}
              description={
                isDraft && outputLinePreview.length > 0
                  ? `${outputLinePreview.length} produto${outputLinePreview.length > 1 ? "s" : ""} adicionado${outputLinePreview.length > 1 ? "s" : ""} — clique numa linha para ver ou adicionar insumos extras.`
                  : undefined
              }
              collapsible
              defaultOpen
            >
              {isDraft ? (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_8rem_auto]">
                    <Select
                      label="Produto"
                      value={stagingProduct}
                      onChange={(e) => setStagingProduct(e.target.value)}
                    >
                      <option value="">Selecione</option>
                      {availableOutputProducts.map((product) => (
                        <option
                          key={product.idProduct}
                          value={product.idProduct}
                        >
                          {productOptionLabel(product)}
                        </option>
                      ))}
                    </Select>
                    <NumberInput
                      label="Quantidade"
                      value={stagingQty}
                      onValueChange={setStagingQty}
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      loading={busy}
                      disabled={busy || !stagingProduct || stagingQty <= 0}
                      onClick={handleAddOutput}
                    >
                      Adicionar saída
                    </Button>
                  </div>

                  {outputLinePreview.length === 0 ? (
                    <p className="text-[13px] text-ink-muted">
                      Nenhum produto de saída adicionado ainda.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {outputLinePreview.map((line) => {
                        const isExpanded =
                          expandedOutputId === line.idProductionOrderOutput;
                        const takenExtras = new Set(
                          line.extras.map((extra) => extra.idProduct),
                        );
                        const availableExtraProducts = extraProducts.filter(
                          (product) => !takenExtras.has(product.idProduct),
                        );
                        const staging = extraStaging[
                          line.idProductionOrderOutput
                        ] ?? { idProduct: "", quantity: 0 };
                        return (
                          <div
                            key={line.idProductionOrderOutput}
                            className="rounded-lg border border-hairline"
                          >
                            <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                              <button
                                type="button"
                                className="flex min-w-0 flex-1 items-center gap-2 text-left"
                                aria-expanded={isExpanded}
                                onClick={() =>
                                  setExpandedOutputId((prev) =>
                                    prev === line.idProductionOrderOutput
                                      ? null
                                      : line.idProductionOrderOutput,
                                  )
                                }
                              >
                                <ChevronDown
                                  size={16}
                                  className={`shrink-0 text-ink-subtle transition-transform duration-200 ${
                                    isExpanded ? "rotate-180" : ""
                                  }`}
                                />
                                <div className="min-w-0">
                                  <p className="truncate text-[14px] font-medium text-ink">
                                    {line.productName}
                                  </p>
                                  <p className="text-[12px] text-ink-muted tabular-nums">
                                    {qty(line.quantity)} un. · custo un.{" "}
                                    <span className="font-semibold text-brand-600">
                                      {unitBrl(line.unitCost)}
                                    </span>
                                    {line.extraLines.length > 0 &&
                                      ` · ${line.extraLines.length} extra${line.extraLines.length > 1 ? "s" : ""}`}
                                  </p>
                                </div>
                              </button>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={busy}
                                className="!text-err-fg hover:!bg-err-bg shrink-0"
                                onClick={() =>
                                  handleRemoveOutput(
                                    line.idProductionOrderOutput,
                                  )
                                }
                              >
                                Remover
                              </Button>
                            </div>

                            {isExpanded && (
                              <div className="border-t border-hairline p-3">
                                {line.extraLines.length > 0 && (
                                  <ul className="mb-3 space-y-1 text-[12px] text-ink-muted">
                                    {line.extraLines.map((extra) => (
                                      <li
                                        key={extra.idProductionOrderOutputExtra}
                                        className="flex items-center justify-between gap-3"
                                      >
                                        <span>
                                          {qty(extra.quantity)}{" "}
                                          {extra.productName} —{" "}
                                          {brl(extra.lineCost)}
                                        </span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          disabled={busy}
                                          className="!text-err-fg hover:!bg-err-bg"
                                          onClick={() =>
                                            handleRemoveExtra(
                                              line.idProductionOrderOutput,
                                              extra.idProductionOrderOutputExtra,
                                            )
                                          }
                                        >
                                          Remover
                                        </Button>
                                      </li>
                                    ))}
                                  </ul>
                                )}

                                <div className="grid grid-cols-1 items-end gap-2 sm:grid-cols-[1fr_7rem_auto]">
                                  <Select
                                    label="Insumo extra (ex.: Nutella)"
                                    value={staging.idProduct}
                                    onChange={(e) =>
                                      updateExtraStaging(
                                        line.idProductionOrderOutput,
                                        { idProduct: e.target.value },
                                      )
                                    }
                                  >
                                    <option value="">Selecione</option>
                                    {availableExtraProducts.map((product) => (
                                      <option
                                        key={product.idProduct}
                                        value={product.idProduct}
                                      >
                                        {productOptionLabel(product)}
                                      </option>
                                    ))}
                                  </Select>
                                  <NumberInput
                                    label="Qtd."
                                    value={staging.quantity}
                                    onValueChange={(next) =>
                                      updateExtraStaging(
                                        line.idProductionOrderOutput,
                                        { quantity: next },
                                      )
                                    }
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    loading={busy}
                                    disabled={
                                      busy ||
                                      !staging.idProduct ||
                                      staging.quantity <= 0
                                    }
                                    onClick={() =>
                                      handleAddExtra(
                                        line.idProductionOrderOutput,
                                      )
                                    }
                                  >
                                    Adicionar extra
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <DataTable
                  data={open.outputs}
                  getId={(row) => row.idProductionOrderOutput}
                  emptyMessage="Nenhum produto registrado."
                  columns={[
                    { key: "productName", label: "Produto" },
                    {
                      key: "quantity",
                      label: "Qtd.",
                      className: "text-right tabular-nums",
                      render: (row) => qty(row.quantity),
                    },
                    {
                      key: "unitCost",
                      label: "Custo un.",
                      className: "text-right tabular-nums",
                      render: (row) => unitBrl(row.unitCost),
                    },
                    {
                      key: "extras",
                      label: "Extras",
                      render: (row) =>
                        row.extras.length > 0
                          ? row.extras
                              .map(
                                (extra) =>
                                  `${qty(extra.quantity)} ${extra.productName}`,
                              )
                              .join(", ")
                          : "—",
                    },
                  ]}
                />
              )}
            </SectionCard>

            <SectionCard
              title={
                isDraft ? "Insumos a consumir (prévia)" : "Insumos consumidos"
              }
              action={
                isDraft ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() => setConfirm({ kind: "sync" })}
                    >
                      Sincronizar com a receita
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      className="!text-err-fg hover:!bg-err-bg"
                      onClick={() => setConfirm({ kind: "cancel" })}
                    >
                      Excluir produção
                    </Button>
                  </div>
                ) : undefined
              }
            >
              <DataTable
                data={insumosPreviewRows}
                getId={(row) => row.key}
                emptyMessage="A receita não tem ingredientes."
                columns={[
                  { key: "productName", label: "Insumo" },
                  {
                    key: "quantity",
                    label: "Qtd.",
                    className: "text-right tabular-nums",
                    render: (row) => `${qty(row.quantity)} ${row.unit}`,
                  },
                  {
                    key: "unitCost",
                    label: isDraft ? "Custo médio atual" : "Custo un.",
                    className: "text-right tabular-nums",
                    render: (row) => unitBrl(row.unitCost),
                  },
                  {
                    key: "lineCost",
                    label: "Subtotal",
                    className: "text-right tabular-nums",
                    render: (row) => brl(row.lineCost),
                  },
                ]}
              />

              <dl className="mt-4 space-y-1.5 border-t border-hairline pt-4 text-[13px]">
                <div className="flex justify-between">
                  <dt className="text-ink-muted">Custo dos insumos</dt>
                  <dd className="tabular-nums">{brl(preview.inputsCost)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-muted">
                    Mão de obra + outros custos
                  </dt>
                  <dd className="tabular-nums">
                    {brl(
                      isDraft
                        ? editLabor + editOverhead
                        : open.laborCost + open.overheadCost,
                    )}
                  </dd>
                </div>
                {isDraft && totalExtrasCost > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-ink-muted">Insumos extras</dt>
                    <dd className="tabular-nums">{brl(totalExtrasCost)}</dd>
                  </div>
                )}
                <div className="flex justify-between border-t border-hairline pt-1.5 font-semibold">
                  <dt>Custo total</dt>
                  <dd className="tabular-nums">{brl(grandTotalCost)}</dd>
                </div>
                <div className="flex justify-between text-[15px] font-semibold text-brand-600">
                  <dt>
                    Custo médio por unidade ({qty(preview.outputQty)} un. no
                    total)
                  </dt>
                  <dd className="tabular-nums">{brl(grandUnitCost)}</dd>
                </div>
              </dl>

              {isDraft && canComplete && (
                <div className="mt-4">
                  <Button
                    variant="primary"
                    loading={busy}
                    disabled={
                      busy ||
                      open.items.length === 0 ||
                      open.outputs.length === 0
                    }
                    onClick={handleComplete}
                  >
                    Concluir produção (baixar insumos + gerar produtos)
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
        title="Extrato da produção"
        subtitle={statementOrder?.recipeName ?? undefined}
      >
        {renderProductionStatement()}
      </Drawer>

      <ConfirmDialog
        open={confirm !== null}
        title={
          confirm?.kind === "cancel"
            ? "Excluir produção"
            : confirm?.kind === "duplicate"
              ? "Duplicar produção"
              : "Sincronizar com a receita"
        }
        description={
          confirm?.kind === "cancel"
            ? "A ordem será cancelada e não poderá mais ser editada. Nenhum estoque foi movimentado ainda."
            : confirm?.kind === "duplicate"
              ? `Isso cria uma nova produção em rascunho de "${confirm.order.recipeName}" com os mesmos lotes, mão de obra e saídas (+ extras) de "${formatDateOnlyDisplay(confirm.order.productionDate)}" — é só ajustar o que mudar e concluir.`
              : "Os insumos desta ordem serão recalculados a partir da receita como ela está agora — ingredientes adicionados, removidos ou com quantidade alterada na receita passam a valer aqui. Mão de obra e outros custos não são afetados."
        }
        variant={confirm?.kind === "cancel" ? "danger" : "default"}
        confirmLabel={
          confirm?.kind === "cancel"
            ? "Excluir"
            : confirm?.kind === "duplicate"
              ? "Duplicar"
              : "Sincronizar"
        }
        cancelLabel="Voltar"
        loading={confirmBusy}
        onConfirm={runConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
