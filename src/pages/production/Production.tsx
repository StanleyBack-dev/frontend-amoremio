import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "@atoms/Button";
import NumberInput from "@atoms/NumberInput";
import CurrencyInput from "@atoms/CurrencyInput";
import Input from "@atoms/Input";
import Select from "@atoms/Select";
import Badge from "@atoms/Badge";
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
import { formatDateTimeDisplay } from "@/utils/format";
import type { Recipe } from "@/api/recipes/schema";
import type { StockItem } from "@/api/inventory/schema";
import type {
  ListProductionOrdersParams,
  ProductionOrder,
  ProductionOrderFilterOptions,
} from "@/api/production/schema";
import {
  cancelProductionOrder,
  completeProductionOrder,
  createProductionOrder,
  fetchProductionOrderById,
  fetchProductionOrderFilterOptions,
  fetchProductionOrders,
  productionOrderStatusLabel,
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

  const [createRecipeId, setCreateRecipeId] = useState("");
  const [createBatches, setCreateBatches] = useState(1);
  const [createDate, setCreateDate] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [editBatches, setEditBatches] = useState(0);
  const [editActual, setEditActual] = useState(0);
  const [editLabor, setEditLabor] = useState(0);
  const [editOverhead, setEditOverhead] = useState(0);

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
      const [orderResult, recipeResult, stockList] = await Promise.all([
        fetchProductionOrders(buildListParams()),
        fetchRecipes({ idStore: activeStoreId, limit: 500, status: true }),
        fetchStoreStock({ idStore: activeStoreId, limit: 200 }),
      ]);
      setOrders(orderResult.items);
      setListMeta({
        total: orderResult.pagination.total,
        totalPages: orderResult.pagination.totalPages,
      });
      setRecipes(recipeResult.items);
      setStock(stockList.items);
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
    setEditBatches(order.batches);
    setEditActual(order.actualOutputQuantity);
    setEditLabor(order.laborCost);
    setEditOverhead(order.overheadCost);
  }

  async function refreshOpen(idProductionOrder: string) {
    if (!activeStoreId) return;
    const fresh = await track(
      fetchProductionOrderById(activeStoreId, idProductionOrder),
    );
    setOpen(fresh);
    syncEdit(fresh);
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
      await updateProductionOrder({
        idStore: activeStoreId,
        idProductionOrder: open.idProductionOrder,
        batches: editBatches > 0 ? editBatches : undefined,
        actualOutputQuantity: editActual > 0 ? editActual : undefined,
        laborCost: editLabor,
        overheadCost: editOverhead,
      });
      await refreshOpen(open.idProductionOrder);
    } catch (error) {
      showError(
        "Erro ao salvar",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    }
  }

  async function handleComplete() {
    if (!activeStoreId || !open) return;
    setBusy(true);
    try {
      const done = await completeProductionOrder(
        activeStoreId,
        open.idProductionOrder,
      );
      showSuccess(
        "Produção concluída",
        "Ingredientes baixados e produto gerado no estoque.",
      );
      setOpen(done);
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
    const outputQty = isRascunho
      ? editActual || plannedQty
      : open.actualOutputQuantity;
    const unitCost = outputQty > 0 ? round4(totalCost / outputQty) : 0;
    return { lines, inputsCost, totalCost, unitCost, outputQty, plannedQty };
  }, [
    open,
    avgCostByProduct,
    editBatches,
    editLabor,
    editOverhead,
    editActual,
  ]);

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
              key: "productionDate",
              label: "Data",
              render: (row) =>
                new Date(row.productionDate).toLocaleDateString("pt-BR"),
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
              render: (row) =>
                row.status === "CONCLUIDA" ? brl(row.outputUnitCost) : "—",
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
            <SectionCard title="Dados da produção">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <NumberInput
                  label="Nº de lotes"
                  value={editBatches}
                  onValueChange={(next) => {
                    // Keep the produced quantity tracking the plan while the
                    // user hasn't overridden it, so the preview stays coherent.
                    const perBatch =
                      open.batches > 0
                        ? open.plannedOutputQuantity / open.batches
                        : open.plannedOutputQuantity;
                    if (Math.abs(editActual - perBatch * editBatches) < 0.001) {
                      setEditActual(round4(perBatch * next));
                    }
                    setEditBatches(next);
                  }}
                  onBlur={saveEdit}
                  disabled={!isDraft}
                />
                <NumberInput
                  label={`Quantidade produzida (${open.outputProductName})`}
                  value={editActual}
                  onValueChange={setEditActual}
                  onBlur={saveEdit}
                  disabled={!isDraft}
                  hint={`planejado: ${qty(preview.plannedQty)}`}
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
              title={
                isDraft ? "Insumos a consumir (prévia)" : "Insumos consumidos"
              }
            >
              <DataTable
                data={preview.lines}
                getId={(row) => row.idProductionOrderItem}
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
                <div className="flex justify-between border-t border-hairline pt-1.5 font-semibold">
                  <dt>Custo total</dt>
                  <dd className="tabular-nums">{brl(preview.totalCost)}</dd>
                </div>
                <div className="flex justify-between text-[15px] font-semibold text-brand-600">
                  <dt>
                    Custo por {open.outputProductName} ({qty(preview.outputQty)}{" "}
                    un.)
                  </dt>
                  <dd className="tabular-nums">{brl(preview.unitCost)}</dd>
                </div>
              </dl>

              {isDraft && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {canComplete && (
                    <Button
                      variant="primary"
                      loading={busy}
                      disabled={busy || open.items.length === 0}
                      onClick={handleComplete}
                    >
                      Concluir produção (baixar insumos + gerar produto)
                    </Button>
                  )}
                  <Button variant="outline" onClick={handleCancel}>
                    Cancelar ordem
                  </Button>
                </div>
              )}
            </SectionCard>
          </div>
        )}
      </Drawer>
    </div>
  );
}
