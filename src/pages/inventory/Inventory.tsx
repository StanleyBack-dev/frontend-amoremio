import { useCallback, useEffect, useState } from "react";
import Button from "@atoms/Button";
import Input from "@atoms/Input";
import CurrencyInput from "@atoms/CurrencyInput";
import NumberInput from "@atoms/NumberInput";
import Select from "@atoms/Select";
import Badge from "@atoms/Badge";
import FilterPanel from "@/components/molecules/FilterPanel";
import Pagination from "@/components/molecules/Pagination";
import SectionCard from "@/components/organisms/SectionCard";
import DataTable from "@/components/organisms/DataTable";
import Drawer from "@/components/organisms/Drawer";
import { useTablePagination } from "@/shared/pagination/useTablePagination";
import { useToast } from "@/shared/toast/useToast";
import { useStoreContext } from "@/features/stores";
import {
  fetchProductFilterOptions,
  fetchProducts,
  kindOptions,
  kindShortLabel,
  kindTone,
  unitLabel,
  unitOptions,
} from "@/features/catalog";
import type { Product, ProductFilterOptions } from "@/api/catalog/schema";
import {
  adjustmentTypeOptions,
  adjustStock,
  fetchStockMovements,
  fetchStoreStock,
  movementTypeLabel,
  movementTypeOptions,
  movementTypeTone,
} from "@/features/inventory";
import type { StockItem, StockMovement } from "@/api/inventory/schema";

const NO_BRAND = "__none__";

const emptyFilters = {
  name: "",
  brand: "",
  kind: "",
  unit: "",
  status: "",
};

const emptyMoveFilters = { product: "", type: "" };

const brl = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const qty = (value: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(value);

// Unit costs show 2 decimals like everything else. The only exception is a
// sub-cent value (e.g. R$ 0,00435 per gram of sugar), which the plain format
// would collapse to "R$ 0,00" — those get extra decimals so they stay legible.
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

type AdjustType = "AJUSTE_POSITIVO" | "AJUSTE_NEGATIVO" | "PERDA";

export default function Inventory() {
  const { showError, showSuccess } = useToast();
  const { activeStore, activeStoreId } = useStoreContext();
  const canAdjust =
    activeStore?.role === "DONO" ||
    activeStore?.role === "GERENTE" ||
    activeStore?.role === null;

  const [items, setItems] = useState<StockItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [stockValueTotal, setStockValueTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [movesLoading, setMovesLoading] = useState(false);
  const [filters, setFilters] = useState(emptyFilters);
  const [filterOptions, setFilterOptions] = useState<ProductFilterOptions>({
    names: [],
    brands: [],
    creators: [],
  });

  const [moveDrawerOpen, setMoveDrawerOpen] = useState(false);
  const [moveFilters, setMoveFilters] = useState(emptyMoveFilters);
  const [products, setProducts] = useState<Product[]>([]);

  const {
    page: stockPageNum,
    limit: stockLimit,
    meta: stockMeta,
    setPage: setStockPage,
    setLimit: setStockLimit,
    setMeta: setStockMeta,
    reset: resetStockPage,
  } = useTablePagination();
  const {
    page: movePageNum,
    limit: moveLimit,
    meta: moveMeta,
    setPage: setMovePage,
    setLimit: setMoveLimit,
    setMeta: setMoveMeta,
    reset: resetMovePage,
  } = useTablePagination();

  const patchFilters = (patch: Partial<typeof emptyFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    resetStockPage();
  };
  const clearFilters = () => {
    setFilters(emptyFilters);
    resetStockPage();
  };
  const patchMoveFilters = (patch: Partial<typeof emptyMoveFilters>) => {
    setMoveFilters((prev) => ({ ...prev, ...patch }));
    resetMovePage();
  };
  const clearMoveFilters = () => {
    setMoveFilters(emptyMoveFilters);
    resetMovePage();
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);
  const hasActiveMoveFilters = Object.values(moveFilters).some(Boolean);

  const [adjustProduct, setAdjustProduct] = useState<StockItem | null>(null);
  const [adjustType, setAdjustType] = useState<AdjustType>("AJUSTE_POSITIVO");
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustCost, setAdjustCost] = useState(0);
  const [adjustNote, setAdjustNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!activeStoreId) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const stock = await fetchStoreStock({
        idStore: activeStoreId,
        name: filters.name || undefined,
        brand:
          filters.brand && filters.brand !== NO_BRAND
            ? filters.brand
            : undefined,
        withoutBrand: filters.brand === NO_BRAND || undefined,
        kind: filters.kind || undefined,
        unit: filters.unit || undefined,
        status: filters.status ? filters.status === "true" : undefined,
        page: stockPageNum,
        limit: stockLimit,
      });
      setItems(stock.items);
      setStockValueTotal(stock.stockValueTotal);
      setStockMeta({
        total: stock.pagination.total,
        totalPages: stock.pagination.totalPages,
      });
    } catch (error) {
      showError(
        "Erro ao carregar estoque",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    activeStoreId,
    filters,
    stockPageNum,
    stockLimit,
    setStockMeta,
    showError,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadMovements = useCallback(async () => {
    if (!activeStoreId) {
      setMovements([]);
      return;
    }
    setMovesLoading(true);
    try {
      const moves = await fetchStockMovements({
        idStore: activeStoreId,
        idProduct: moveFilters.product || undefined,
        type: moveFilters.type || undefined,
        page: movePageNum,
        limit: moveLimit,
      });
      setMovements(moves.items);
      setMoveMeta({
        total: moves.pagination.total,
        totalPages: moves.pagination.totalPages,
      });
    } catch (error) {
      showError(
        "Erro ao carregar movimentações",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    } finally {
      setMovesLoading(false);
    }
  }, [
    activeStoreId,
    moveFilters,
    movePageNum,
    moveLimit,
    setMoveMeta,
    showError,
  ]);

  useEffect(() => {
    void loadMovements();
  }, [loadMovements]);

  useEffect(() => {
    if (!activeStoreId) {
      setProducts([]);
      return;
    }
    void fetchProducts({ idStore: activeStoreId, limit: 500 })
      .then((res) => setProducts(res.items))
      .catch(() => setProducts([]));
  }, [activeStoreId]);

  const loadFilterOptions = useCallback(async () => {
    if (!activeStoreId) {
      setFilterOptions({ names: [], brands: [], creators: [] });
      return;
    }
    try {
      setFilterOptions(await fetchProductFilterOptions(activeStoreId));
    } catch {
      setFilterOptions({ names: [], brands: [], creators: [] });
    }
  }, [activeStoreId]);

  useEffect(() => {
    void loadFilterOptions();
  }, [loadFilterOptions]);

  function openAdjust(item: StockItem) {
    setAdjustProduct(item);
    setAdjustType("AJUSTE_POSITIVO");
    setAdjustQty(0);
    setAdjustCost(0);
    setAdjustNote("");
  }

  async function handleAdjust() {
    if (!activeStoreId || !adjustProduct) return;
    if (adjustQty <= 0) {
      showError("Quantidade inválida", "Informe um valor maior que zero.");
      return;
    }

    setSaving(true);
    try {
      await adjustStock({
        idStore: activeStoreId,
        idProduct: adjustProduct.idProduct,
        type: adjustType,
        quantity: adjustQty,
        unitCost: adjustCost > 0 ? adjustCost : undefined,
        note: adjustNote.trim() || undefined,
      });
      showSuccess("Estoque ajustado", "");
      setAdjustProduct(null);
      await Promise.all([load(), loadMovements()]);
    } catch (error) {
      showError(
        "Erro ao ajustar estoque",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!activeStoreId) {
    return (
      <div className="flex flex-col gap-6">
        <SectionCard title="Nenhuma loja ativa">
          <p className="text-[13px] text-ink-muted">
            Selecione uma loja em <strong className="text-ink">Lojas</strong>{" "}
            para ver o estoque.
          </p>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionCard
        title="Saldo por produto"
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMoveDrawerOpen(true)}
          >
            Histórico de movimentações
          </Button>
        }
      >
        <p className="mb-3 text-[13px] text-ink-muted">
          Valor imobilizado em estoque:{" "}
          <strong className="text-brand-600">{brl(stockValueTotal)}</strong>
        </p>

        <FilterPanel hasActiveFilters={hasActiveFilters}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <Select
              label="Nome"
              value={filters.name}
              onChange={(e) => patchFilters({ name: e.target.value })}
            >
              <option value="">Todos</option>
              {filterOptions.names.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>

            <Select
              label="Marca"
              value={filters.brand}
              onChange={(e) => patchFilters({ brand: e.target.value })}
            >
              <option value="">Todas</option>
              <option value={NO_BRAND}>Sem marca</option>
              {filterOptions.brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </Select>

            <Select
              label="Tipo"
              value={filters.kind}
              onChange={(e) => patchFilters({ kind: e.target.value })}
            >
              <option value="">Todos</option>
              {kindOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>

            <Select
              label="Unidade"
              value={filters.unit}
              onChange={(e) => patchFilters({ unit: e.target.value })}
            >
              <option value="">Todas</option>
              {unitOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>

            <Select
              label="Situação"
              value={filters.status}
              onChange={(e) => patchFilters({ status: e.target.value })}
            >
              <option value="">Todas</option>
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
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
          data={items}
          getId={(row) => row.idProduct}
          emptyMessage={
            loading
              ? "Carregando..."
              : hasActiveFilters
                ? "Nenhum produto para os filtros aplicados."
                : "Nenhum produto no estoque."
          }
          onView={openAdjust}
          viewLabel="Ver / ajustar estoque"
          columns={[
            { key: "productName", label: "Produto" },
            {
              key: "brand",
              label: "Marca",
              render: (row) => row.brand ?? "—",
            },
            {
              key: "kind",
              label: "Tipo",
              render: (row) => (
                <Badge tone={kindTone[row.kind]}>
                  {kindShortLabel[row.kind]}
                </Badge>
              ),
            },
            {
              key: "quantityOnHand",
              label: "Quantidade",
              className: "text-right tabular-nums",
              render: (row) => `${qty(row.quantityOnHand)} ${row.unit}`,
            },
            {
              key: "averageCost",
              label: "Custo médio",
              className: "text-right tabular-nums",
              render: (row) => unitBrl(row.averageCost),
            },
            {
              key: "stockValue",
              label: "Valor em estoque",
              className: "text-right tabular-nums",
              render: (row) => brl(row.stockValue),
            },
          ]}
        />

        <Pagination
          page={stockPageNum}
          pageCount={stockMeta.totalPages}
          total={stockMeta.total}
          pageSize={stockLimit}
          disabled={loading}
          onPageChange={setStockPage}
          onPageSizeChange={setStockLimit}
        />
      </SectionCard>

      <Drawer
        open={!!adjustProduct}
        onClose={() => setAdjustProduct(null)}
        title={
          adjustProduct
            ? canAdjust
              ? `Ajustar estoque`
              : "Estoque do produto"
            : ""
        }
        subtitle={adjustProduct?.productName}
        footer={
          canAdjust ? (
            <>
              <Button variant="outline" onClick={() => setAdjustProduct(null)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                loading={saving}
                disabled={saving}
                onClick={handleAdjust}
              >
                Confirmar ajuste
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setAdjustProduct(null)}>
              Fechar
            </Button>
          )
        }
      >
        {adjustProduct && (
          <div className="flex flex-col gap-4">
            <div className="rounded-md border border-hairline bg-card-alt px-3 py-2.5 text-[13px] text-ink-muted">
              Saldo atual:{" "}
              <strong className="text-ink tabular-nums">
                {qty(adjustProduct.quantityOnHand)}{" "}
                {unitLabel[adjustProduct.unit]}
              </strong>
              <br />
              Custo médio:{" "}
              <strong className="text-ink tabular-nums">
                {unitBrl(adjustProduct.averageCost)}
              </strong>
              <br />
              Valor em estoque:{" "}
              <strong className="text-ink tabular-nums">
                {brl(adjustProduct.quantityOnHand * adjustProduct.averageCost)}
              </strong>
            </div>

            {canAdjust && (
              <>
                <Select
                  label="Tipo"
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as AdjustType)}
                >
                  {adjustmentTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                <NumberInput
                  label="Quantidade"
                  value={adjustQty}
                  onValueChange={setAdjustQty}
                />
                {adjustType === "AJUSTE_POSITIVO" && (
                  <CurrencyInput
                    label={`Custo de 1 ${adjustProduct.unit} (opcional)`}
                    value={adjustCost}
                    onValueChange={setAdjustCost}
                    hint={
                      adjustCost > 0 && adjustQty > 0
                        ? `${qty(adjustQty)} × ${unitBrl(adjustCost)} = ${brl(
                            adjustCost * adjustQty,
                          )} no total`
                        : "custo de UMA unidade — usa o custo médio atual se vazio"
                    }
                  />
                )}
                <Input
                  label="Observação (opcional)"
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                />
              </>
            )}
          </div>
        )}
      </Drawer>

      <Drawer
        open={moveDrawerOpen}
        onClose={() => setMoveDrawerOpen(false)}
        width="xl"
        title="Histórico de movimentações"
        subtitle="Entradas, saídas e ajustes de estoque"
      >
        <div className="flex flex-col gap-4">
          <FilterPanel hasActiveFilters={hasActiveMoveFilters}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Select
                label="Produto"
                value={moveFilters.product}
                onChange={(e) => patchMoveFilters({ product: e.target.value })}
              >
                <option value="">Todos</option>
                {products.map((product) => (
                  <option key={product.idProduct} value={product.idProduct}>
                    {product.name}
                  </option>
                ))}
              </Select>

              <Select
                label="Tipo"
                value={moveFilters.type}
                onChange={(e) => patchMoveFilters({ type: e.target.value })}
              >
                <option value="">Todos</option>
                {movementTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>

              <div className="flex items-end justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  disabled={!hasActiveMoveFilters}
                  onClick={clearMoveFilters}
                >
                  Limpar filtros
                </Button>
              </div>
            </div>
          </FilterPanel>

          <DataTable
            data={movements}
            getId={(row) => row.idStockMovement}
            emptyMessage={
              movesLoading
                ? "Carregando..."
                : hasActiveMoveFilters
                  ? "Nenhuma movimentação para os filtros aplicados."
                  : "Nenhuma movimentação registrada."
            }
            columns={[
              {
                key: "occurredAt",
                label: "Data",
                render: (row) =>
                  new Date(row.occurredAt).toLocaleString("pt-BR"),
              },
              { key: "productName", label: "Produto" },
              {
                key: "type",
                label: "Tipo",
                render: (row) => (
                  <Badge tone={movementTypeTone[row.type]}>
                    {movementTypeLabel[row.type]}
                  </Badge>
                ),
              },
              {
                key: "quantity",
                label: "Qtd.",
                className: "text-right tabular-nums",
                render: (row) => `${qty(row.quantity)} ${row.unit}`,
              },
              {
                key: "resultingQuantity",
                label: "Saldo após",
                className: "text-right tabular-nums",
                render: (row) => `${qty(row.resultingQuantity)} ${row.unit}`,
              },
              {
                key: "resultingAverageCost",
                label: "Custo médio após",
                className: "text-right tabular-nums",
                render: (row) => unitBrl(row.resultingAverageCost),
              },
            ]}
          />

          <Pagination
            page={movePageNum}
            pageCount={moveMeta.totalPages}
            total={moveMeta.total}
            pageSize={moveLimit}
            disabled={movesLoading}
            onPageChange={setMovePage}
            onPageSizeChange={setMoveLimit}
          />
        </div>
      </Drawer>
    </div>
  );
}
