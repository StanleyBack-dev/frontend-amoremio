import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Button from "@atoms/Button";
import Input from "@atoms/Input";
import CurrencyInput from "@atoms/CurrencyInput";
import NumberInput from "@atoms/NumberInput";
import Select from "@atoms/Select";
import Badge from "@atoms/Badge";
import ConfirmDialog from "@/components/molecules/ConfirmDialog";
import Pagination from "@/components/molecules/Pagination";
import SectionCard from "@/components/organisms/SectionCard";
import DataTable from "@/components/organisms/DataTable";
import Drawer from "@/components/organisms/Drawer";
import { useTablePagination } from "@/shared/pagination/useTablePagination";
import { useToast } from "@/shared/toast/useToast";
import { useLoading } from "@/shared/loading";
import { formatDateTimeDisplay } from "@/utils/format";
import { useStoreContext } from "@/features/stores";
import {
  fetchProducts,
  kindShortLabel,
  kindTone,
  productOptionLabel,
  RECIPE_INPUT_KINDS,
  RECIPE_OUTPUT_KINDS,
  unitLabel,
} from "@/features/catalog";
import type { Product } from "@/api/catalog/schema";
import type { Recipe } from "@/api/recipes/schema";
import {
  addRecipeItems,
  createRecipe,
  fetchRecipeById,
  fetchRecipes,
  removeRecipeItem,
  updateRecipe,
} from "@/features/recipes";

type StagedItem = { key: string; idProduct: string; quantity: number };

type PendingConfirm =
  | { kind: "removeItem"; idRecipeItem: string; productName: string }
  | { kind: "toggleStatus"; activating: boolean }
  | null;

const qty = (value: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(value);

export default function Recipes() {
  const { showError, showSuccess } = useToast();
  const { track } = useLoading();
  const { activeStore, activeStoreId } = useStoreContext();
  const canManage =
    activeStore?.role === "DONO" ||
    activeStore?.role === "GERENTE" ||
    activeStore?.role === null;

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [outputProducts, setOutputProducts] = useState<Product[]>([]);
  const [inputs, setInputs] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState<Recipe | null>(null);
  const [busy, setBusy] = useState(false);

  // create form
  const [createOutput, setCreateOutput] = useState("");
  const [createName, setCreateName] = useState("");
  const [createYield, setCreateYield] = useState(0);
  const [creating, setCreating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  // header edit
  const [headerName, setHeaderName] = useState("");
  const [headerYield, setHeaderYield] = useState(0);
  const [headerLabor, setHeaderLabor] = useState(0);
  const [headerOverhead, setHeaderOverhead] = useState(0);

  // add-item form (staging list, saved in one call)
  const [itemProduct, setItemProduct] = useState("");
  const [itemQty, setItemQty] = useState(0);
  const [staged, setStaged] = useState<StagedItem[]>([]);

  const [confirm, setConfirm] = useState<PendingConfirm>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const confirmLock = useRef(false);

  const {
    page: listPage,
    limit: listLimit,
    meta: listMeta,
    setPage: setListPage,
    setLimit: setListLimit,
    setMeta: setListMeta,
  } = useTablePagination();

  const load = useCallback(async () => {
    if (!activeStoreId) {
      setRecipes([]);
      return;
    }
    setLoading(true);
    try {
      const [recipeResult, outputs, ingredients] = await Promise.all([
        fetchRecipes({
          idStore: activeStoreId,
          page: listPage,
          limit: listLimit,
        }),
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
      setRecipes(recipeResult.items);
      setListMeta({
        total: recipeResult.pagination.total,
        totalPages: recipeResult.pagination.totalPages,
      });
      setOutputProducts(outputs.items);
      setInputs(ingredients.items);
    } catch (error) {
      showError(
        "Erro ao carregar receitas",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }, [activeStoreId, listPage, listLimit, setListMeta, showError]);

  useEffect(() => {
    void load();
  }, [load]);

  // Drop the staging list whenever a different recipe drawer is opened/closed.
  useEffect(() => {
    setStaged([]);
    setItemProduct("");
    setItemQty(0);
  }, [open?.idRecipe]);

  const outputUnit = useMemo(() => {
    if (!open) return "";
    return open.yieldUnit;
  }, [open]);

  function syncHeader(recipe: Recipe) {
    setHeaderName(recipe.name);
    setHeaderYield(recipe.yieldQuantity);
    setHeaderLabor(recipe.laborCost);
    setHeaderOverhead(recipe.overheadCost);
  }

  async function refreshOpen(idRecipe: string) {
    if (!activeStoreId) return;
    const fresh = await track(fetchRecipeById(activeStoreId, idRecipe));
    setOpen(fresh);
    syncHeader(fresh);
  }

  // The list below only refreshes when the drawer closes — not on every field
  // change inside it.
  function closeDrawer() {
    setOpen(null);
    void load();
  }

  // Products that do not have a recipe yet.
  const availableOutputs = useMemo(() => {
    const taken = new Set(recipes.map((r) => r.idOutputProduct));
    return outputProducts.filter((p) => !taken.has(p.idProduct));
  }, [recipes, outputProducts]);

  const outputKindById = useMemo(() => {
    const map = new Map<string, Product["kind"]>();
    for (const product of outputProducts)
      map.set(product.idProduct, product.kind);
    return map;
  }, [outputProducts]);

  async function handleCreate() {
    if (!activeStoreId || !createOutput) return;
    if (createYield <= 0) {
      showError("Rendimento inválido", "Informe um valor maior que zero.");
      return;
    }
    setCreating(true);
    try {
      const created = await createRecipe({
        idStore: activeStoreId,
        idOutputProduct: createOutput,
        name: createName.trim() || undefined,
        yieldQuantity: createYield,
      });
      setCreateOpen(false);
      setCreateOutput("");
      setCreateName("");
      setCreateYield(0);
      await load();
      setOpen(created);
      syncHeader(created);
      showSuccess("Ficha técnica criada", "Agora adicione os ingredientes.");
    } catch (error) {
      showError(
        "Erro ao criar receita",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function saveHeader() {
    if (!activeStoreId || !open) return;
    try {
      await updateRecipe({
        idStore: activeStoreId,
        idRecipe: open.idRecipe,
        name: headerName.trim() || undefined,
        yieldQuantity: headerYield > 0 ? headerYield : undefined,
        laborCost: headerLabor,
        overheadCost: headerOverhead,
      });
      await refreshOpen(open.idRecipe);
    } catch (error) {
      showError(
        "Erro ao salvar",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    }
  }

  async function toggleStatus() {
    if (!activeStoreId || !open) return;
    try {
      await updateRecipe({
        idStore: activeStoreId,
        idRecipe: open.idRecipe,
        status: !open.status,
      });
      await refreshOpen(open.idRecipe);
    } catch (error) {
      showError(
        "Erro ao alterar situação",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    }
  }

  // A product can only appear once — already on the recipe or already staged.
  const isDuplicateInput = useCallback(
    (idProduct: string) =>
      (open?.items.some((item) => item.idProduct === idProduct) ?? false) ||
      staged.some((row) => row.idProduct === idProduct),
    [open, staged],
  );

  function handleAddToList() {
    if (!itemProduct || itemQty <= 0) return;
    if (isDuplicateInput(itemProduct)) {
      showError(
        "Ingrediente repetido",
        "Este ingrediente já está na lista ou na ficha. Ajuste a quantidade da linha existente.",
      );
      return;
    }
    setStaged((prev) => [
      ...prev,
      {
        key: `${itemProduct}-${Date.now()}-${prev.length}`,
        idProduct: itemProduct,
        quantity: itemQty,
      },
    ]);
    setItemProduct("");
    setItemQty(0);
  }

  function handleRemoveStaged(key: string) {
    setStaged((prev) => prev.filter((row) => row.key !== key));
  }

  async function handleSaveStaged() {
    if (!activeStoreId || !open) return;
    // Fold a filled-but-not-yet-added row into the batch so the user never
    // loses what they just typed.
    const items = [
      ...staged.map((row) => ({
        idProduct: row.idProduct,
        quantity: row.quantity,
      })),
      ...(itemProduct && itemQty > 0
        ? [{ idProduct: itemProduct, quantity: itemQty }]
        : []),
    ];
    if (items.length === 0) return;
    setBusy(true);
    try {
      const updated = await addRecipeItems({
        idStore: activeStoreId,
        idRecipe: open.idRecipe,
        items,
      });
      setOpen(updated);
      setStaged([]);
      setItemProduct("");
      setItemQty(0);
      showSuccess(
        "Ingredientes adicionados",
        `A ficha agora tem ${updated.items.length} ingrediente${
          updated.items.length > 1 ? "s" : ""
        }.`,
      );
    } catch (error) {
      showError(
        "Erro ao adicionar ingredientes",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveItem(idRecipeItem: string) {
    if (!activeStoreId || !open) return;
    try {
      setOpen(
        await removeRecipeItem(activeStoreId, open.idRecipe, idRecipeItem),
      );
    } catch (error) {
      showError(
        "Erro ao remover ingrediente",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    }
  }

  async function runConfirm() {
    if (!confirm || confirmLock.current) return;
    confirmLock.current = true;
    setConfirmBusy(true);
    try {
      if (confirm.kind === "removeItem") {
        await handleRemoveItem(confirm.idRecipeItem);
      } else {
        await toggleStatus();
      }
      setConfirm(null);
    } finally {
      confirmLock.current = false;
      setConfirmBusy(false);
    }
  }

  const inputById = useMemo(() => {
    const map = new Map<string, Product>();
    for (const product of inputs) map.set(product.idProduct, product);
    return map;
  }, [inputs]);

  // Hide ingredients already on the recipe or already staged — a product can
  // only have one line, edited by quantity.
  const availableInputs = useMemo(() => {
    const taken = new Set<string>();
    for (const item of open?.items ?? []) taken.add(item.idProduct);
    for (const row of staged) taken.add(row.idProduct);
    return inputs.filter((product) => !taken.has(product.idProduct));
  }, [inputs, open, staged]);

  const itemUnit = useMemo(() => {
    const product = inputById.get(itemProduct);
    return product ? unitLabel[product.unit] : "";
  }, [inputById, itemProduct]);

  const stagedToSave = staged.length + (itemProduct && itemQty > 0 ? 1 : 0);

  if (!activeStoreId) {
    return (
      <div className="flex flex-col gap-6">
        <SectionCard title="Nenhuma loja ativa">
          <p className="text-[13px] text-ink-muted">
            Selecione uma loja em <strong className="text-ink">Lojas</strong>{" "}
            para gerenciar as fichas técnicas.
          </p>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionCard
        title="Fichas técnicas"
        action={
          canManage ? (
            <Button
              variant="primary"
              disabled={availableOutputs.length === 0}
              onClick={() => setCreateOpen(true)}
            >
              Nova ficha técnica
            </Button>
          ) : undefined
        }
      >
        {canManage && availableOutputs.length === 0 && recipes.length === 0 && (
          <p className="mb-3 text-[13px] text-ink-muted">
            Cadastre um produto do tipo <strong>Produto final</strong> ou{" "}
            <strong>Intermediário</strong> em{" "}
            <strong className="text-ink">Produtos</strong> para criar a primeira
            ficha técnica.
          </p>
        )}
        <DataTable
          data={recipes}
          getId={(row) => row.idRecipe}
          emptyMessage={
            loading ? "Carregando..." : "Nenhuma ficha técnica cadastrada."
          }
          onView={(row) => refreshOpen(row.idRecipe)}
          viewLabel="Abrir ficha técnica"
          columns={[
            { key: "name", label: "Receita" },
            { key: "outputProductName", label: "Produto de saída" },
            {
              key: "outputKind",
              label: "Tipo",
              render: (row) => {
                const kind = outputKindById.get(row.idOutputProduct);
                return (
                  <Badge tone={kind ? kindTone[kind] : "gold"}>
                    {kind ? kindShortLabel[kind] : "Produto final"}
                  </Badge>
                );
              },
            },
            {
              key: "yieldQuantity",
              label: "Rendimento",
              className: "text-right tabular-nums",
              render: (row) => `${qty(row.yieldQuantity)} ${row.yieldUnit}`,
            },
            {
              key: "items",
              label: "Ingredientes",
              className: "text-right tabular-nums",
              render: (row) => row.items.length,
            },
            {
              key: "status",
              label: "Situação",
              render: (row) => (
                <Badge tone={row.status ? "success" : "neutral"}>
                  {row.status ? "Ativa" : "Inativa"}
                </Badge>
              ),
            },
            {
              key: "createdByUserName",
              label: "Criada por",
              render: (row) => row.createdByUserName ?? "—",
            },
            {
              key: "createdAt",
              label: "Criada em",
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
        title="Nova ficha técnica"
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              loading={creating}
              disabled={creating || !createOutput || createYield <= 0}
              onClick={handleCreate}
            >
              Criar
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <Select
              label="Produto de saída"
              value={createOutput}
              onChange={(e) => setCreateOutput(e.target.value)}
            >
              <option value="">Selecione</option>
              {availableOutputs.map((product) => (
                <option key={product.idProduct} value={product.idProduct}>
                  {productOptionLabel(product)}
                </option>
              ))}
            </Select>
            <p className="mt-1 text-[11px] text-ink-subtle">
              Produto final ou intermediário (sub-receita).
            </p>
          </div>
          <Input
            label="Nome da receita (opcional)"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            placeholder="padrão: nome do produto"
          />
          <NumberInput
            label="Rendimento (quantidade produzida por lote)"
            value={createYield}
            onValueChange={setCreateYield}
          />
        </div>
      </Drawer>

      <Drawer
        open={!!open}
        onClose={closeDrawer}
        width="xl"
        title={open ? open.name : "Ficha técnica"}
        subtitle={open?.outputProductName ?? undefined}
      >
        {open && (
          <div className="flex flex-col gap-5">
            <SectionCard title="Dados da receita">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  label="Nome da receita"
                  value={headerName}
                  onChange={(e) => setHeaderName(e.target.value)}
                  onBlur={saveHeader}
                  disabled={!canManage}
                />
                <NumberInput
                  label={`Rendimento (${outputUnit})`}
                  value={headerYield}
                  onValueChange={setHeaderYield}
                  onBlur={saveHeader}
                  disabled={!canManage}
                />
                <CurrencyInput
                  label="Mão de obra por lote (opcional)"
                  value={headerLabor}
                  onValueChange={setHeaderLabor}
                  onBlur={saveHeader}
                  disabled={!canManage}
                />
                <CurrencyInput
                  label="Outros custos por lote (opcional)"
                  value={headerOverhead}
                  onValueChange={setHeaderOverhead}
                  onBlur={saveHeader}
                  disabled={!canManage}
                />
              </div>
              {canManage && (
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setConfirm({
                        kind: "toggleStatus",
                        activating: !open.status,
                      })
                    }
                  >
                    {open.status ? "Inativar receita" : "Reativar receita"}
                  </Button>
                </div>
              )}
            </SectionCard>

            {canManage && (
              <SectionCard title="Adicionar ingredientes">
                <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1.6fr_1fr_auto]">
                  <Select
                    label="Ingrediente"
                    value={itemProduct}
                    onChange={(e) => setItemProduct(e.target.value)}
                  >
                    <option value="">Selecione</option>
                    {availableInputs.map((product) => (
                      <option key={product.idProduct} value={product.idProduct}>
                        {productOptionLabel(product)}
                      </option>
                    ))}
                  </Select>
                  <NumberInput
                    label={`Quantidade${itemUnit ? ` (${itemUnit})` : ""}`}
                    value={itemQty}
                    onValueChange={setItemQty}
                  />
                  <Button
                    variant="outline"
                    disabled={!itemProduct || itemQty <= 0}
                    onClick={handleAddToList}
                  >
                    Adicionar à lista
                  </Button>
                </div>
                <p className="mt-2 text-[11px] text-ink-subtle">
                  Monte a lista de insumos e produtos intermediários e salve
                  todos de uma vez. A quantidade é o consumo para produzir um
                  rendimento ({qty(open.yieldQuantity)} {open.yieldUnit}).
                </p>

                {stagedToSave > 0 && (
                  <div className="mt-4 flex flex-col gap-3">
                    {staged.length > 0 && (
                      <ul className="flex flex-col rounded-lg border border-hairline">
                        {staged.map((row) => {
                          const product = inputById.get(row.idProduct);
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
                                  {qty(row.quantity)}{" "}
                                  {product ? unitLabel[product.unit] : ""}
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
                        Adicionar {stagedToSave} ingrediente
                        {stagedToSave > 1 ? "s" : ""} à ficha
                      </Button>
                    </div>
                  </div>
                )}
              </SectionCard>
            )}

            <SectionCard title="Ingredientes">
              <DataTable
                data={open.items}
                getId={(row) => row.idRecipeItem}
                emptyMessage="Nenhum ingrediente adicionado."
                columns={[
                  { key: "productName", label: "Insumo" },
                  {
                    key: "quantity",
                    label: "Qtd. por lote",
                    className: "text-right tabular-nums",
                    render: (row) => `${qty(row.quantity)} ${row.unit}`,
                  },
                  ...(canManage
                    ? [
                        {
                          key: "actions",
                          label: "",
                          className: "text-right",
                          render: (row: Recipe["items"][number]) => (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="!text-err-fg hover:!bg-err-bg"
                              onClick={() =>
                                setConfirm({
                                  kind: "removeItem",
                                  idRecipeItem: row.idRecipeItem,
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
        variant={
          confirm?.kind === "toggleStatus" && confirm.activating
            ? "warning"
            : "danger"
        }
        title={
          confirm?.kind === "removeItem"
            ? "Remover ingrediente"
            : confirm?.kind === "toggleStatus" && confirm.activating
              ? "Reativar receita"
              : "Inativar receita"
        }
        confirmLabel={
          confirm?.kind === "removeItem"
            ? "Remover"
            : confirm?.kind === "toggleStatus" && confirm.activating
              ? "Reativar"
              : "Inativar"
        }
        description={
          confirm?.kind === "removeItem" ? (
            <>
              Remover{" "}
              <strong className="text-ink">{confirm.productName}</strong> desta
              ficha técnica?
            </>
          ) : confirm?.kind === "toggleStatus" && confirm.activating ? (
            "A receita volta a ficar disponível para novas produções."
          ) : (
            "A receita fica indisponível para novas produções (as já registradas não mudam)."
          )
        }
      />
    </div>
  );
}
