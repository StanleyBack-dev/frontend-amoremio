import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@atoms/Button";
import Input from "@atoms/Input";
import NumberInput from "@atoms/NumberInput";
import Select from "@atoms/Select";
import Badge from "@atoms/Badge";
import FilterPanel from "@/components/molecules/FilterPanel";
import Pagination from "@/components/molecules/Pagination";
import ConfirmDialog from "@/components/molecules/ConfirmDialog";
import SectionCard from "@/components/organisms/SectionCard";
import DataTable from "@/components/organisms/DataTable";
import Drawer from "@/components/organisms/Drawer";
import Modal from "@/components/organisms/Modal";
import { formatDateTimeDisplay } from "@/utils/format";
import { useTablePagination } from "@/shared/pagination/useTablePagination";
import { useToast } from "@/shared/toast/useToast";
import { useLoading } from "@/shared/loading";
import { useStoreContext } from "@/features/stores";
import { purchaseRoutePaths } from "@/router/navigation";
import {
  fetchProducts,
  productOptionLabel,
  PURCHASABLE_KINDS,
  unitLabel,
} from "@/features/catalog";
import {
  addShoppingListItems,
  cancelShoppingList,
  convertShoppingListToPurchase,
  createShoppingList,
  fetchShoppingListById,
  fetchShoppingLists,
  removeShoppingListItem,
  shoppingListStatusLabel,
} from "@/features/shopping-list";
import { fetchPurchaseById } from "@/features/purchasing";
import type { Product } from "@/api/catalog/schema";
import type { Purchase } from "@/api/purchasing/schema";
import type {
  ListShoppingListsParams,
  ShoppingList as ShoppingListRecord,
  ShoppingListStatus,
} from "@/api/shopping-list/schema";

const shoppingListStatusTone: Record<
  ShoppingListStatus,
  "warning" | "success" | "danger"
> = {
  ABERTA: "warning",
  CONVERTIDA: "success",
  CANCELADA: "danger",
};

const emptyFilters = { status: "" };
const emptyCreateForm = { name: "", notes: "" };

// Staged locally (no network round-trip) so building a long list stays fast —
// only "Adicionar N itens à lista" persists the whole batch at once, same
// pattern as Receitas' ingredient list.
type StagedItem = {
  key: string;
  idProduct: string;
  desiredQuantity: number;
  note?: string;
};

type PendingConfirm =
  | { kind: "removeItem"; idShoppingListItem: string; productName: string }
  | { kind: "cancel" }
  | { kind: "convert" }
  | null;

export default function ShoppingList() {
  const { showError, showSuccess } = useToast();
  const { track } = useLoading();
  const navigate = useNavigate();
  const { activeStore, activeStoreId } = useStoreContext();
  const canManage =
    activeStore?.role === "DONO" ||
    activeStore?.role === "GERENTE" ||
    activeStore?.role === null;

  const [lists, setLists] = useState<ShoppingListRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [open, setOpen] = useState<ShoppingListRecord | null>(null);
  const [busy, setBusy] = useState(false);
  // The purchase this list was linked to, if any — read-only, just to show
  // "quoted vs. actually bought" side by side for analysis.
  const [linkedPurchase, setLinkedPurchase] = useState<Purchase | null>(null);

  const [itemProduct, setItemProduct] = useState("");
  const [itemQty, setItemQty] = useState(0);
  const [itemNote, setItemNote] = useState("");
  const [staged, setStaged] = useState<StagedItem[]>([]);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [creating, setCreating] = useState(false);

  const [confirm, setConfirm] = useState<PendingConfirm>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const confirmLock = useRef(false);

  const [filters, setFilters] = useState(emptyFilters);
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

  const buildListParams = useCallback((): ListShoppingListsParams => {
    const params: ListShoppingListsParams = {
      idStore: activeStoreId as string,
      page: listPage,
      limit: listLimit,
    };
    if (filters.status) {
      params.status = filters.status as ShoppingListStatus;
    }
    return params;
  }, [activeStoreId, filters, listPage, listLimit]);

  const loadLists = useCallback(async () => {
    if (!activeStoreId) return;
    try {
      const result = await fetchShoppingLists(buildListParams());
      setLists(result.items);
      setListMeta({
        total: result.pagination.total,
        totalPages: result.pagination.totalPages,
      });
    } catch (error) {
      showError(
        "Erro ao carregar listas de compras",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    }
  }, [activeStoreId, buildListParams, setListMeta, showError]);

  const loadProducts = useCallback(async () => {
    if (!activeStoreId) return;
    try {
      const result = await fetchProducts({
        idStore: activeStoreId,
        limit: 500,
        status: true,
        kinds: PURCHASABLE_KINDS,
      });
      setProducts(result.items);
    } catch {
      setProducts([]);
    }
  }, [activeStoreId]);

  useEffect(() => {
    void loadLists();
  }, [loadLists]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  function resetItemFields() {
    setItemProduct("");
    setItemQty(0);
    setItemNote("");
    setStaged([]);
  }

  async function openList(list: ShoppingListRecord) {
    if (!activeStoreId) return;
    const fresh = await track(
      fetchShoppingListById(activeStoreId, list.idShoppingList),
    );
    setOpen(fresh);
    resetItemFields();
    if (fresh.convertedToPurchaseId) {
      try {
        setLinkedPurchase(
          await fetchPurchaseById(activeStoreId, fresh.convertedToPurchaseId),
        );
      } catch {
        setLinkedPurchase(null);
      }
    } else {
      setLinkedPurchase(null);
    }
  }

  function closeDrawer() {
    setOpen(null);
    setLinkedPurchase(null);
    resetItemFields();
    void loadLists();
  }

  // Base-unit equivalent of what was actually bought for this product on the
  // linked purchase — `baseQuantity` is only frozen once finalized, so before
  // that this derives it live the same way the purchase form's own preview
  // does (purchasedQuantity × conversionFactor).
  function purchasedQuantityFor(idProduct: string): number | null {
    const item = linkedPurchase?.items.find((i) => i.idProduct === idProduct);
    if (!item) return null;
    return item.baseQuantity > 0
      ? item.baseQuantity
      : item.purchasedQuantity * item.conversionFactor;
  }

  function openCreate() {
    setCreateForm(emptyCreateForm);
    setCreateModalOpen(true);
  }

  async function handleCreateList() {
    if (!activeStoreId || creating) return;
    setCreating(true);
    try {
      const created = await createShoppingList({
        idStore: activeStoreId,
        name: createForm.name.trim() || undefined,
        notes: createForm.notes.trim() || undefined,
      });
      setCreateModalOpen(false);
      setOpen(created);
      resetItemFields();
      showSuccess("Lista criada", "Adicione os itens que precisa comprar.");
    } catch (error) {
      showError(
        "Erro ao criar lista",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    } finally {
      setCreating(false);
    }
  }

  // Products already on the list or already staged are hidden from the
  // picker — one product, one line (same rule Compras/Receitas use).
  const isDuplicateProduct = useCallback(
    (idProduct: string) =>
      (open?.items.some((item) => item.idProduct === idProduct) ?? false) ||
      staged.some((row) => row.idProduct === idProduct),
    [open, staged],
  );

  const availableProducts = useMemo(() => {
    const taken = new Set<string>();
    for (const item of open?.items ?? []) taken.add(item.idProduct);
    for (const row of staged) taken.add(row.idProduct);
    return products.filter((product) => !taken.has(product.idProduct));
  }, [products, open, staged]);

  function handleAddToList() {
    if (!itemProduct || itemQty <= 0) return;
    if (isDuplicateProduct(itemProduct)) {
      showError(
        "Produto repetido",
        "Este produto já está na lista ou já foi adicionado — ajuste a quantidade da linha existente.",
      );
      return;
    }
    setStaged((prev) => [
      ...prev,
      {
        key: `${itemProduct}-${Date.now()}-${prev.length}`,
        idProduct: itemProduct,
        desiredQuantity: itemQty,
        note: itemNote.trim() || undefined,
      },
    ]);
    setItemProduct("");
    setItemQty(0);
    setItemNote("");
  }

  function handleRemoveStaged(key: string) {
    setStaged((prev) => prev.filter((row) => row.key !== key));
  }

  const stagedToSave = staged.length + (itemProduct && itemQty > 0 ? 1 : 0);

  async function handleSaveStaged() {
    if (!activeStoreId || !open) return;
    // Fold a filled-but-not-yet-added row into the batch so the user never
    // loses what they just typed.
    const items = [
      ...staged.map((row) => ({
        idProduct: row.idProduct,
        desiredQuantity: row.desiredQuantity,
        note: row.note,
      })),
      ...(itemProduct && itemQty > 0
        ? [
            {
              idProduct: itemProduct,
              desiredQuantity: itemQty,
              note: itemNote.trim() || undefined,
            },
          ]
        : []),
    ];
    if (items.length === 0) return;
    setBusy(true);
    try {
      const updated = await addShoppingListItems({
        idStore: activeStoreId,
        idShoppingList: open.idShoppingList,
        items,
      });
      setOpen(updated);
      setStaged([]);
      setItemProduct("");
      setItemQty(0);
      setItemNote("");
      showSuccess(
        "Itens adicionados",
        `A lista agora tem ${updated.items.length} item${
          updated.items.length > 1 ? "s" : ""
        }.`,
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

  async function handleRemoveItem(idShoppingListItem: string) {
    if (!activeStoreId || !open || open.status !== "ABERTA") return;
    try {
      setOpen(
        await removeShoppingListItem(
          activeStoreId,
          open.idShoppingList,
          idShoppingListItem,
        ),
      );
    } catch (error) {
      showError(
        "Erro ao remover item",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    }
  }

  async function handleCancelList() {
    if (busy || !activeStoreId || !open || open.status !== "ABERTA") return;
    setBusy(true);
    try {
      await cancelShoppingList(activeStoreId, open.idShoppingList);
      showSuccess("Lista cancelada", "");
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

  async function handleConvert() {
    if (busy || !activeStoreId || !open || open.status !== "ABERTA") return;
    if (open.items.length === 0) {
      showError("Lista vazia", "Adicione ao menos um item antes de converter.");
      return;
    }
    setBusy(true);
    try {
      await convertShoppingListToPurchase(activeStoreId, open.idShoppingList);
      showSuccess(
        "Lista convertida",
        "Um rascunho de compra foi criado e vinculado a esta lista — abra-o em Compras, onde ela aparece como checklist, e adicione os itens manualmente.",
      );
      closeDrawer();
      navigate(purchaseRoutePaths.list);
    } catch (error) {
      showError(
        "Erro ao converter",
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
        await handleRemoveItem(confirm.idShoppingListItem);
      } else if (confirm.kind === "cancel") {
        await handleCancelList();
      } else {
        await handleConvert();
      }
      setConfirm(null);
    } finally {
      confirmLock.current = false;
      setConfirmBusy(false);
    }
  }

  const isOpenStatus = open?.status === "ABERTA";

  if (!activeStoreId) {
    return (
      <div className="flex flex-col gap-6">
        <SectionCard title="Nenhuma loja ativa">
          <p className="text-[13px] text-ink-muted">
            Selecione uma loja em <strong className="text-ink">Lojas</strong>{" "}
            para gerenciar listas de compras.
          </p>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionCard
        title="Listas de compras"
        action={
          canManage ? (
            <Button variant="primary" onClick={openCreate}>
              Nova lista
            </Button>
          ) : undefined
        }
      >
        <FilterPanel hasActiveFilters={hasActiveFilters}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Select
              label="Situação"
              value={filters.status}
              onChange={(e) => patchFilters({ status: e.target.value })}
            >
              <option value="">Todas</option>
              <option value="ABERTA">Aberta</option>
              <option value="CONVERTIDA">Convertida</option>
              <option value="CANCELADA">Cancelada</option>
            </Select>

            <div className="flex items-end justify-end md:col-start-3">
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
          data={lists}
          getId={(row) => row.idShoppingList}
          emptyMessage={
            hasActiveFilters
              ? "Nenhuma lista para os filtros aplicados."
              : "Nenhuma lista de compras cadastrada."
          }
          onView={openList}
          viewLabel="Abrir lista"
          columns={[
            {
              key: "name",
              label: "Nome",
              render: (row) => row.name ?? "Lista sem nome",
            },
            {
              key: "status",
              label: "Situação",
              render: (row) => (
                <Badge tone={shoppingListStatusTone[row.status]}>
                  {shoppingListStatusLabel[row.status]}
                </Badge>
              ),
            },
            {
              key: "items",
              label: "Itens",
              className: "text-right tabular-nums",
              render: (row) => row.items.length,
            },
            {
              key: "createdByUserName",
              label: "Criado por",
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
          onPageChange={setListPage}
          onPageSizeChange={setListLimit}
        />
      </SectionCard>

      <Drawer
        open={!!open}
        onClose={closeDrawer}
        width="lg"
        title={
          open
            ? `${open.name ?? "Lista sem nome"} · ${shoppingListStatusLabel[open.status]}`
            : "Lista de compras"
        }
        footer={
          open && isOpenStatus && canManage ? (
            <>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => setConfirm({ kind: "cancel" })}
              >
                Cancelar lista
              </Button>
              <Button
                variant="primary"
                loading={busy}
                disabled={busy || open.items.length === 0}
                onClick={() => setConfirm({ kind: "convert" })}
              >
                Converter em compra
              </Button>
            </>
          ) : undefined
        }
      >
        {open && (
          <div className="flex flex-col gap-5">
            {open.notes && (
              <p className="rounded-md border border-hairline bg-card-alt px-3 py-2 text-[12px] text-ink-muted">
                {open.notes}
              </p>
            )}

            {open.status === "CONVERTIDA" && (
              <p className="rounded-md border border-ok-border bg-ok-bg px-3 py-2 text-[12px] text-ok-fg">
                Esta lista foi convertida em um rascunho de compra. Abra{" "}
                <strong>Compras</strong> para revisar e finalizar.
              </p>
            )}

            {isOpenStatus && (
              <SectionCard title="Adicionar item">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
                      Produto
                    </span>
                    <Select
                      value={itemProduct}
                      onChange={(e) => setItemProduct(e.target.value)}
                    >
                      <option value="">Selecione</option>
                      {availableProducts.map((product) => (
                        <option
                          key={product.idProduct}
                          value={product.idProduct}
                        >
                          {productOptionLabel(product)}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <NumberInput
                    label={`Quantidade${
                      itemProduct
                        ? ` (${unitLabel[products.find((p) => p.idProduct === itemProduct)?.unit ?? "UN"]})`
                        : ""
                    }`}
                    value={itemQty}
                    onValueChange={setItemQty}
                    maxDecimals={3}
                  />
                  <div className="sm:col-span-3">
                    <Input
                      label="Observação (opcional)"
                      value={itemNote}
                      onChange={(e) => setItemNote(e.target.value)}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    disabled={!itemProduct || itemQty <= 0}
                    onClick={handleAddToList}
                  >
                    Adicionar à lista
                  </Button>
                </div>
                <p className="mt-2 text-[11px] text-ink-subtle">
                  Monte a lista de itens e salve todos de uma vez — mais rápido
                  do que confirmar item por item.
                </p>

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
                                  {row.desiredQuantity}{" "}
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
                        Adicionar {stagedToSave}{" "}
                        {stagedToSave > 1 ? "itens" : "item"} à lista
                      </Button>
                    </div>
                  </div>
                )}
              </SectionCard>
            )}

            <SectionCard title="Itens da lista">
              <DataTable
                data={open.items}
                getId={(row) => row.idShoppingListItem}
                emptyMessage="Nenhum item adicionado."
                columns={[
                  {
                    key: "productName",
                    label: "Produto",
                    render: (row) => {
                      const brand = products.find(
                        (p) => p.idProduct === row.idProduct,
                      )?.brand;
                      return brand
                        ? `${row.productName} · ${brand}`
                        : row.productName;
                    },
                  },
                  {
                    key: "desiredQuantity",
                    label: "Cotado",
                    className: "text-right tabular-nums",
                    render: (row) => `${row.desiredQuantity} ${row.unit}`,
                  },
                  {
                    key: "purchasedQuantity",
                    label: "Comprado",
                    className: "text-right tabular-nums",
                    render: (row) => {
                      const bought = purchasedQuantityFor(row.idProduct);
                      return bought !== null ? `${bought} ${row.unit}` : "—";
                    },
                  },
                  {
                    key: "note",
                    label: "Observação",
                    render: (row) => row.note ?? "—",
                  },
                  ...(isOpenStatus
                    ? [
                        {
                          key: "actions",
                          label: "",
                          className: "text-right",
                          render: (
                            row: ShoppingListRecord["items"][number],
                          ) => (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="!text-err-fg hover:!bg-err-bg"
                              onClick={() =>
                                setConfirm({
                                  kind: "removeItem",
                                  idShoppingListItem: row.idShoppingListItem,
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

      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        width="md"
        title="Nova lista de compras"
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              loading={creating}
              onClick={handleCreateList}
            >
              Criar
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4">
          <Input
            label="Nome (opcional)"
            value={createForm.name}
            autoFocus
            onChange={(e) =>
              setCreateForm({ ...createForm, name: e.target.value })
            }
          />
          <Input
            label="Observações (opcional)"
            value={createForm.notes}
            onChange={(e) =>
              setCreateForm({ ...createForm, notes: e.target.value })
            }
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={confirm !== null}
        title={
          confirm?.kind === "cancel"
            ? "Cancelar lista de compras"
            : confirm?.kind === "convert"
              ? "Converter em compra"
              : "Remover item"
        }
        description={
          confirm?.kind === "cancel"
            ? "A lista será cancelada e não poderá mais ser editada."
            : confirm?.kind === "convert"
              ? "Um rascunho de compra vazio será criado e vinculado a esta lista. Os itens não são copiados — em Compras, esta lista aparece como um checklist de referência, e você adiciona os itens de compra manualmente, como sempre."
              : `Remover "${confirm?.kind === "removeItem" ? confirm.productName : ""}" da lista?`
        }
        variant={confirm?.kind === "cancel" ? "danger" : "default"}
        confirmLabel={
          confirm?.kind === "cancel"
            ? "Cancelar lista"
            : confirm?.kind === "convert"
              ? "Converter"
              : "Remover"
        }
        cancelLabel="Voltar"
        loading={confirmBusy}
        onConfirm={runConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
