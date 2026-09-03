import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
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
import Modal from "@/components/organisms/Modal";
import ConfirmDialog from "@/components/molecules/ConfirmDialog";
import DocumentField from "@/components/molecules/DocumentField";
import { formatDateTimeDisplay } from "@/utils/format";
import { useTablePagination } from "@/shared/pagination/useTablePagination";
import { useToast } from "@/shared/toast/useToast";
import { useLoading } from "@/shared/loading";
import { useStoreContext } from "@/features/stores";
import {
  createProduct,
  fetchProducts,
  packagingUnitLabel,
  packagingUnitOptions,
  productOptionLabel,
  PURCHASABLE_KINDS,
  unitLabel,
  unitOptions,
} from "@/features/catalog";
import { createBrand, fetchBrands } from "@/features/brands";
import { createSupplier, fetchSuppliers } from "@/features/suppliers";
import { formatBrazilianPhone } from "@/utils/format";
import { isBrazilianDocumentValid } from "@/utils/validators";
import type { Brand } from "@/api/brands/schema";
import type {
  PackagingUnit,
  Product,
  ProductKind,
  UnitOfMeasure,
} from "@/api/catalog/schema";
import type { Supplier } from "@/api/suppliers/schema";
import type { Purchase } from "@/api/purchasing/schema";
import {
  addPurchaseItem,
  calcLineTotal,
  cancelPurchase,
  createPurchaseDraft,
  fetchPurchaseById,
  fetchPurchaseFilterOptions,
  fetchPurchases,
  finalizePurchase,
  purchaseStatusLabel,
  removePurchaseItem,
  updatePurchaseHeader,
} from "@/features/purchasing";
import type {
  ListPurchasesParams,
  PurchaseDiscountMode,
  PurchaseFilterOptions,
} from "@/api/purchasing/schema";

const round2 = (value: number) => Math.round(value * 100) / 100;
const round6 = (value: number) => Math.round(value * 1_000_000) / 1_000_000;

const brl = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

// Cost per base unit shows 2 decimals like everything else; only a sub-cent
// value (e.g. R$ 0,00435 per gram) gets extra decimals so it does not collapse
// to "R$ 0,00".
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

const qtyFmt = (value: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(value);

const purchaseStatusTone: Record<string, "warning" | "success" | "danger"> = {
  RASCUNHO: "warning",
  FINALIZADA: "success",
  CANCELADA: "danger",
};

const emptySupplierForm = {
  name: "",
  phone: "",
  email: "",
  instagram: "",
  document: "",
  address: "",
};

const emptyProductForm = {
  name: "",
  brand: "",
  kind: "INSUMO" as ProductKind,
  unit: "UN" as UnitOfMeasure,
  packagingUnit: "UNIDADE" as PackagingUnit,
  packSize: 1,
};

const emptyFilters = { supplier: "", status: "", createdBy: "" };

type PendingConfirm =
  | { kind: "removeItem"; idPurchaseItem: string; productName: string }
  | { kind: "cancel" }
  | { kind: "finalize" }
  | null;

export default function Purchases() {
  const { showError, showSuccess } = useToast();
  const { track } = useLoading();
  const { activeStore, activeStoreId } = useStoreContext();
  const canManage =
    activeStore?.role === "DONO" ||
    activeStore?.role === "GERENTE" ||
    activeStore?.role === null;

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [open, setOpen] = useState<Purchase | null>(null);
  // Composing a brand-new purchase: the drawer is open but nothing is saved
  // yet. The RASCUNHO record is only created when the first item is added.
  const [composingNew, setComposingNew] = useState(false);
  const [busy, setBusy] = useState(false);

  const [supplier, setSupplier] = useState("");
  const [freight, setFreight] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [discountMode, setDiscountMode] =
    useState<PurchaseDiscountMode>("VALOR");
  const [discountPercent, setDiscountPercent] = useState(0);

  const [itemProduct, setItemProduct] = useState("");
  const [itemQty, setItemQty] = useState(0);
  const [itemUnit, setItemUnit] = useState("");
  const [itemFactor, setItemFactor] = useState(1);
  const [itemPrice, setItemPrice] = useState(0);

  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [supplierForm, setSupplierForm] = useState(emptySupplierForm);
  const [savingSupplier, setSavingSupplier] = useState(false);

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [savingProduct, setSavingProduct] = useState(false);

  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [savingBrand, setSavingBrand] = useState(false);

  const [confirm, setConfirm] = useState<PendingConfirm>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  // Synchronous lock — `confirmBusy` state updates too late to block a fast
  // double-click on the confirm button.
  const confirmLock = useRef(false);

  const [filters, setFilters] = useState(emptyFilters);
  const [filterOptions, setFilterOptions] = useState<PurchaseFilterOptions>({
    suppliers: [],
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

  const patchFilters = (patch: Partial<typeof emptyFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    resetListPage();
  };
  const clearFilters = () => {
    setFilters(emptyFilters);
    resetListPage();
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  const buildListParams = useCallback((): ListPurchasesParams => {
    const params: ListPurchasesParams = {
      idStore: activeStoreId as string,
      page: listPage,
      limit: listLimit,
    };
    if (filters.supplier) params.supplierName = filters.supplier;
    if (filters.status) {
      params.status = filters.status as ListPurchasesParams["status"];
    }
    if (filters.createdBy) params.createdByUserId = filters.createdBy;
    return params;
  }, [activeStoreId, filters, listPage, listLimit]);

  const loadPurchases = useCallback(async () => {
    if (!activeStoreId) return;
    try {
      const result = await fetchPurchases(buildListParams());
      setPurchases(result.items);
      setListMeta({
        total: result.pagination.total,
        totalPages: result.pagination.totalPages,
      });
    } catch (error) {
      showError(
        "Erro ao carregar compras",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    }
  }, [activeStoreId, buildListParams, setListMeta, showError]);

  const loadFilterOptions = useCallback(async () => {
    if (!activeStoreId) {
      setFilterOptions({ suppliers: [], creators: [] });
      return;
    }
    try {
      setFilterOptions(await fetchPurchaseFilterOptions(activeStoreId));
    } catch {
      setFilterOptions({ suppliers: [], creators: [] });
    }
  }, [activeStoreId]);

  const loadProducts = useCallback(async () => {
    if (!activeStoreId) return;
    try {
      const result = await fetchProducts({
        idStore: activeStoreId,
        limit: 500,
        status: true,
        kinds: ["INSUMO", "REVENDA"],
      });
      setProducts(result.items);
    } catch {
      setProducts([]);
    }
  }, [activeStoreId]);

  const loadSuppliers = useCallback(async () => {
    if (!activeStoreId) return;
    try {
      const result = await fetchSuppliers({
        idStore: activeStoreId,
        limit: 500,
        status: true,
      });
      setSuppliers(result.items);
    } catch {
      setSuppliers([]);
    }
  }, [activeStoreId]);

  const loadBrands = useCallback(async () => {
    if (!activeStoreId) return;
    try {
      const result = await fetchBrands({
        idStore: activeStoreId,
        limit: 500,
        status: true,
      });
      setBrands(result.items);
    } catch {
      setBrands([]);
    }
  }, [activeStoreId]);

  useEffect(() => {
    void loadPurchases();
  }, [loadPurchases]);

  useEffect(() => {
    void loadProducts();
    void loadSuppliers();
    void loadBrands();
    void loadFilterOptions();
  }, [loadProducts, loadSuppliers, loadBrands, loadFilterOptions]);

  function syncHeaderFields(purchase: Purchase) {
    setSupplier(purchase.supplierName ?? "");
    setFreight(purchase.freightAmount ?? 0);
    setDiscount(purchase.discountAmount ?? 0);
    setDiscountMode(purchase.discountMode ?? "VALOR");
    setDiscountPercent(purchase.discountPercent ?? 0);
  }

  async function refreshOpen(idPurchase: string) {
    if (!activeStoreId) return;
    const fresh = await track(fetchPurchaseById(activeStoreId, idPurchase));
    setOpen(fresh);
    syncHeaderFields(fresh);
  }

  function resetItemFields() {
    setItemProduct("");
    setItemQty(0);
    setItemUnit("");
    setItemFactor(1);
    setItemPrice(0);
  }

  // "Nova compra" only opens the form — no record is created until the first
  // item is added (see handleAddItem), so abandoned forms leave nothing behind.
  function handleNew() {
    setOpen(null);
    setComposingNew(true);
    setSupplier("");
    setFreight(0);
    setDiscount(0);
    setDiscountMode("VALOR");
    setDiscountPercent(0);
    resetItemFields();
  }

  function closeDrawer() {
    setOpen(null);
    setComposingNew(false);
    // Keep the list + filter options in sync with whatever changed inside.
    void loadPurchases();
    void loadFilterOptions();
  }

  async function openPurchase(purchase: Purchase) {
    if (!activeStoreId) return;
    setComposingNew(false);
    await refreshOpen(purchase.idPurchase);
  }

  // Persists the header in the background. `next` lets a select/blur pass its
  // just-changed value without waiting for the React state update. The list
  // below is NOT refreshed here — that only happens when the drawer closes.
  async function saveHeader(next?: {
    supplierName?: string;
    freightAmount?: number;
    discountAmount?: number;
    discountMode?: PurchaseDiscountMode;
    discountPercent?: number;
  }) {
    if (!activeStoreId || !open) return;
    // Once finalized, only the supplier / notes label may be corrected — the
    // financial fields are frozen, so we don't even send them.
    const isRascunho = open.status === "RASCUNHO";
    try {
      const updated = await updatePurchaseHeader({
        idStore: activeStoreId,
        idPurchase: open.idPurchase,
        supplierName: (next?.supplierName ?? supplier).trim(),
        ...(isRascunho
          ? {
              freightAmount: next?.freightAmount ?? freight,
              discountAmount: next?.discountAmount ?? discount,
              discountMode: next?.discountMode ?? discountMode,
              discountPercent: next?.discountPercent ?? discountPercent,
            }
          : {}),
      });
      setOpen(updated);
      syncHeaderFields(updated);
    } catch (error) {
      showError(
        "Erro ao salvar dados",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    }
  }

  function handleSupplierChange(name: string) {
    setSupplier(name);
    if (open) void saveHeader({ supplierName: name });
  }

  function handleDiscountModeChange(mode: PurchaseDiscountMode) {
    setDiscountMode(mode);
    if (open) void saveHeader({ discountMode: mode });
  }

  const liveLineTotal = useMemo(
    () => calcLineTotal(itemQty, itemPrice),
    [itemQty, itemPrice],
  );

  const selectedProduct = useMemo(
    () => products.find((p) => p.idProduct === itemProduct) ?? null,
    [products, itemProduct],
  );
  // Real measure (KG/G/L…) the stock/recipes work in, and the label of one
  // physical item being bought.
  const measureUnit = selectedProduct?.unit ?? "";
  const packagingLabel = selectedProduct
    ? packagingUnitLabel[selectedProduct.packagingUnit].toLowerCase()
    : "unidade";
  // Físico comprado × conteúdo por unidade = quanto entra no estoque.
  const stockQty = round2(itemQty * itemFactor);
  const costPerMeasure = itemFactor > 0 ? round6(itemPrice / itemFactor) : 0;

  // Products already on the purchase are hidden from the picker — one product,
  // one line (same rule as recipes).
  const availableProducts = useMemo(() => {
    const taken = new Set((open?.items ?? []).map((item) => item.idProduct));
    return products.filter((product) => !taken.has(product.idProduct));
  }, [products, open]);

  async function handleAddItem() {
    if (busy || !activeStoreId || !itemProduct) return;
    if (itemQty <= 0 || itemFactor <= 0 || itemPrice < 0) {
      showError("Dados inválidos", "Revise quantidade, fator e valor.");
      return;
    }
    if ((open?.items ?? []).some((item) => item.idProduct === itemProduct)) {
      showError(
        "Produto repetido",
        "Este produto já está na compra. Ajuste a quantidade da linha existente.",
      );
      return;
    }
    setBusy(true);
    try {
      let idPurchase = open?.idPurchase;
      // First item of a new purchase: create the RASCUNHO record now and
      // carry over whatever header fields were already typed.
      if (!idPurchase) {
        const draft = await createPurchaseDraft({ idStore: activeStoreId });
        idPurchase = draft.idPurchase;
        if (
          supplier.trim() ||
          freight > 0 ||
          discount > 0 ||
          discountPercent > 0
        ) {
          await updatePurchaseHeader({
            idStore: activeStoreId,
            idPurchase,
            supplierName: supplier.trim(),
            freightAmount: freight,
            discountAmount: discount,
            discountMode,
            discountPercent,
          });
        }
      }
      const updated = await addPurchaseItem({
        idStore: activeStoreId,
        idPurchase,
        idProduct: itemProduct,
        purchasedQuantity: itemQty,
        purchasedUnit: itemUnit.trim() || undefined,
        conversionFactor: itemFactor,
        unitPrice: itemPrice,
      });
      setOpen(updated);
      setComposingNew(false);
      syncHeaderFields(updated);
      resetItemFields();
    } catch (error) {
      showError(
        "Erro ao adicionar item",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveItem(idPurchaseItem: string) {
    if (!activeStoreId || !open || open.status !== "RASCUNHO") return;
    try {
      setOpen(
        await removePurchaseItem(
          activeStoreId,
          open.idPurchase,
          idPurchaseItem,
        ),
      );
    } catch (error) {
      showError(
        "Erro ao remover item",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    }
  }

  async function handleFinalize() {
    if (busy || !activeStoreId || !open || open.status !== "RASCUNHO") return;
    setBusy(true);
    try {
      const finalized = await finalizePurchase(activeStoreId, open.idPurchase);
      showSuccess("Compra finalizada", "O estoque foi atualizado.");
      setOpen(finalized);
    } catch (error) {
      showError(
        "Erro ao finalizar",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    if (busy || !activeStoreId || !open || open.status !== "RASCUNHO") return;
    setBusy(true);
    try {
      await cancelPurchase(activeStoreId, open.idPurchase);
      showSuccess("Compra cancelada", "");
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
        await handleRemoveItem(confirm.idPurchaseItem);
      } else if (confirm.kind === "cancel") {
        await handleCancel();
      } else {
        await handleFinalize();
      }
      setConfirm(null);
    } finally {
      confirmLock.current = false;
      setConfirmBusy(false);
    }
  }

  async function handleCreateSupplier() {
    if (!activeStoreId || savingSupplier) return;
    const name = supplierForm.name.trim();
    if (!name) return;
    if (!isBrazilianDocumentValid(supplierForm.document)) {
      showError("Documento inválido", "Confira o CPF ou CNPJ informado.");
      return;
    }
    setSavingSupplier(true);
    try {
      const created = await createSupplier({
        idStore: activeStoreId,
        name,
        phone: supplierForm.phone.trim() || undefined,
        email: supplierForm.email.trim() || undefined,
        instagram: supplierForm.instagram.trim() || undefined,
        document: supplierForm.document.trim() || undefined,
        address: supplierForm.address.trim() || undefined,
      });
      await loadSuppliers();
      handleSupplierChange(created.name);
      setSupplierModalOpen(false);
      setSupplierForm(emptySupplierForm);
      showSuccess("Fornecedor cadastrado", `"${created.name}" foi adicionado.`);
    } catch (error) {
      showError(
        "Erro ao cadastrar fornecedor",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    } finally {
      setSavingSupplier(false);
    }
  }

  async function handleCreateProduct() {
    if (!activeStoreId || savingProduct) return;
    const name = productForm.name.trim();
    if (!name) return;
    setSavingProduct(true);
    try {
      const created = await createProduct({
        idStore: activeStoreId,
        name,
        brand: productForm.brand.trim() || undefined,
        kind: productForm.kind,
        unit: productForm.unit,
        packagingUnit: productForm.packagingUnit,
        packSize: productForm.packSize > 0 ? productForm.packSize : 1,
      });
      await loadProducts();
      setItemProduct(created.idProduct);
      setItemUnit(packagingUnitLabel[created.packagingUnit]);
      setItemFactor(created.packSize > 0 ? created.packSize : 1);
      setProductModalOpen(false);
      setProductForm(emptyProductForm);
      showSuccess("Produto cadastrado", `"${created.name}" foi adicionado.`);
    } catch (error) {
      showError(
        "Erro ao cadastrar produto",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    } finally {
      setSavingProduct(false);
    }
  }

  async function handleCreateBrand() {
    if (!activeStoreId || savingBrand) return;
    const name = newBrandName.trim();
    if (!name) return;
    setSavingBrand(true);
    try {
      const created = await createBrand({ idStore: activeStoreId, name });
      await loadBrands();
      setProductForm((current) => ({ ...current, brand: created.name }));
      setBrandModalOpen(false);
      setNewBrandName("");
      showSuccess("Marca cadastrada", `"${created.name}" foi adicionada.`);
    } catch (error) {
      showError(
        "Erro ao cadastrar marca",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    } finally {
      setSavingBrand(false);
    }
  }

  if (!activeStoreId) {
    return (
      <div className="flex flex-col gap-6">
        <SectionCard title="Nenhuma loja ativa">
          <p className="text-[13px] text-ink-muted">
            Selecione uma loja em <strong className="text-ink">Lojas</strong>{" "}
            para registrar compras.
          </p>
        </SectionCard>
      </div>
    );
  }

  // A purchase still being composed behaves like a draft in the UI.
  const isDraft = composingNew || open?.status === "RASCUNHO";
  // Supplier / notes are just labels — editable on a finalized purchase too,
  // only a cancelled one is fully read-only.
  const supplierEditable = composingNew || open?.status !== "CANCELADA";
  const itemsShown = open?.items ?? [];
  const subtotalShown = open?.itemsSubtotal ?? 0;
  // While it is a draft, freight/discount/total follow the fields being typed
  // so the math updates instantly (the backend persists on blur). Once
  // finalized, show the frozen authoritative values.
  const freightShown = isDraft ? freight : (open?.freightAmount ?? 0);
  const discountShown = isDraft
    ? discountMode === "PERCENTUAL"
      ? round2(subtotalShown * (discountPercent / 100))
      : discount
    : (open?.discountAmount ?? 0);
  const totalShown = isDraft
    ? Math.max(0, subtotalShown + freightShown - discountShown)
    : (open?.total ?? 0);
  const purchasableKindOptions = PURCHASABLE_KINDS;

  return (
    <div className="flex flex-col gap-6">
      <SectionCard
        title="Compras"
        action={
          canManage ? (
            <Button variant="primary" onClick={handleNew}>
              Nova compra
            </Button>
          ) : undefined
        }
      >
        <FilterPanel hasActiveFilters={hasActiveFilters}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Select
              label="Fornecedor"
              value={filters.supplier}
              onChange={(e) =>
                patchFilters({ supplier: e.target.value })
              }
            >
              <option value="">Todos</option>
              {filterOptions.suppliers.map((name) => (
                <option key={name} value={name}>
                  {name}
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
              <option value="RASCUNHO">Rascunho</option>
              <option value="FINALIZADA">Finalizada</option>
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
          data={purchases}
          getId={(row) => row.idPurchase}
          emptyMessage={
            hasActiveFilters
              ? "Nenhuma compra para os filtros aplicados."
              : "Nenhuma compra registrada."
          }
          onView={openPurchase}
          viewLabel="Abrir compra"
          columns={[
            {
              key: "supplierName",
              label: "Fornecedor",
              render: (row) => row.supplierName ?? "—",
            },
            {
              key: "status",
              label: "Situação",
              render: (row) => (
                <Badge tone={purchaseStatusTone[row.status] ?? "neutral"}>
                  {purchaseStatusLabel[row.status]}
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
              key: "createdAt",
              label: "Início da compra",
              className: "tabular-nums",
              render: (row) => formatDateTimeDisplay(row.createdAt),
            },
            {
              key: "finalizedAt",
              label: "Término da compra",
              className: "tabular-nums",
              render: (row) =>
                row.finalizedAt ? formatDateTimeDisplay(row.finalizedAt) : "—",
            },
            {
              key: "createdByUserName",
              label: "Criado por",
              render: (row) => row.createdByUserName ?? "—",
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
          open ? `Compra ${purchaseStatusLabel[open.status]}` : "Nova compra"
        }
        subtitle={open?.supplierName ?? undefined}
      >
        {(open || composingNew) && (
          <div className="flex flex-col gap-5">
            {composingNew && !open && (
              <p className="rounded-md border border-hairline bg-card-alt px-3 py-2 text-[12px] text-ink-muted">
                A compra é registrada quando você adicionar o primeiro item.
                Fechar agora não cria nada.
              </p>
            )}
            <SectionCard title="Dados da compra">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
                      Fornecedor
                    </span>
                    {supplierEditable && canManage && (
                      <button
                        type="button"
                        onClick={() => {
                          setSupplierForm(emptySupplierForm);
                          setSupplierModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-700"
                      >
                        <Plus size={13} /> Novo fornecedor
                      </button>
                    )}
                  </div>
                  <Select
                    value={supplier}
                    disabled={!supplierEditable}
                    onChange={(e) => handleSupplierChange(e.target.value)}
                  >
                    <option value="">Sem fornecedor</option>
                    {supplier &&
                      !suppliers.some((s) => s.name === supplier) && (
                        <option value={supplier}>{supplier}</option>
                      )}
                    {suppliers.map((s) => (
                      <option key={s.idSupplier} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <CurrencyInput
                  label="Frete"
                  value={freight}
                  onValueChange={setFreight}
                  onBlur={() => saveHeader()}
                  disabled={!isDraft}
                />
                <div>
                  <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
                    Desconto
                  </span>
                  <div className="grid grid-cols-[4.5rem_1fr] gap-2">
                    <Select
                      value={discountMode}
                      disabled={!isDraft}
                      onChange={(e) =>
                        handleDiscountModeChange(
                          e.target.value as PurchaseDiscountMode,
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
                        disabled={!isDraft}
                        maxDecimals={2}
                        suffix="%"
                      />
                    ) : (
                      <CurrencyInput
                        value={discount}
                        onValueChange={setDiscount}
                        onBlur={() => saveHeader()}
                        disabled={!isDraft}
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

            {isDraft && (
              <SectionCard title="Adicionar item">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
                        Produto
                      </span>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => {
                            setProductForm(emptyProductForm);
                            setProductModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-700"
                        >
                          <Plus size={13} /> Novo produto
                        </button>
                      )}
                    </div>
                    <Select
                      value={itemProduct}
                      onChange={(e) => {
                        setItemProduct(e.target.value);
                        const prod = products.find(
                          (p) => p.idProduct === e.target.value,
                        );
                        if (prod) {
                          setItemUnit(packagingUnitLabel[prod.packagingUnit]);
                          setItemFactor(prod.packSize > 0 ? prod.packSize : 1);
                        }
                      }}
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
                    label={`Quantidade comprada${
                      selectedProduct ? ` (${packagingLabel})` : ""
                    }`}
                    value={itemQty}
                    onValueChange={setItemQty}
                  />
                  <CurrencyInput
                    label={`Valor por ${packagingLabel}`}
                    value={itemPrice}
                    onValueChange={setItemPrice}
                  />
                  <NumberInput
                    label={`Conteúdo por ${packagingLabel}${
                      measureUnit ? ` (${measureUnit})` : ""
                    }`}
                    value={itemFactor}
                    onValueChange={setItemFactor}
                    hint={
                      selectedProduct
                        ? `do cadastro do produto — ajuste só se a embalagem veio diferente`
                        : "1 item comprado = X na unidade de medida"
                    }
                  />
                  <div className="flex flex-col justify-end gap-0.5 rounded-md border border-hairline bg-card-alt px-3 py-2 sm:col-span-2 lg:col-span-1">
                    {selectedProduct && (
                      <p className="text-[12px] text-ink-muted tabular-nums">
                        Entra no estoque:{" "}
                        <span className="font-semibold text-ink">
                          {qtyFmt(stockQty)} {measureUnit}
                        </span>{" "}
                        · {unitBrl(costPerMeasure)}/{measureUnit}
                      </p>
                    )}
                    <p className="text-[11px] uppercase tracking-wide text-ink-subtle">
                      Total da linha
                    </p>
                    <p className="text-lg font-semibold text-brand-600 tabular-nums">
                      {brl(liveLineTotal)}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <Button
                    variant="primary"
                    loading={busy}
                    disabled={busy || !itemProduct}
                    onClick={handleAddItem}
                  >
                    Adicionar à lista
                  </Button>
                </div>
              </SectionCard>
            )}

            <SectionCard title="Itens da compra">
              <DataTable
                data={itemsShown}
                getId={(row) => row.idPurchaseItem}
                emptyMessage="Nenhum item adicionado."
                columns={[
                  { key: "productName", label: "Produto" },
                  {
                    key: "purchasedQuantity",
                    label: "Qtd. comprada",
                    render: (row) =>
                      `${row.purchasedQuantity} ${row.purchasedUnit}`,
                  },
                  {
                    key: "conversionFactor",
                    label: "Fator",
                    render: (row) => `× ${row.conversionFactor}`,
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
                  ...(open?.status === "FINALIZADA"
                    ? [
                        {
                          key: "effectiveUnitCost",
                          label: "Custo un. efetivo",
                          className: "text-right tabular-nums",
                          render: (row: Purchase["items"][number]) =>
                            unitBrl(row.effectiveUnitCost),
                        },
                      ]
                    : []),
                  ...(isDraft
                    ? [
                        {
                          key: "actions",
                          label: "",
                          className: "text-right",
                          render: (row: Purchase["items"][number]) => (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="!text-err-fg hover:!bg-err-bg"
                              onClick={() =>
                                setConfirm({
                                  kind: "removeItem",
                                  idPurchaseItem: row.idPurchaseItem,
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

              <dl className="mt-4 space-y-1.5 border-t border-hairline pt-4 text-[13px]">
                <div className="flex justify-between">
                  <dt className="text-ink-muted">Subtotal dos itens</dt>
                  <dd className="tabular-nums">{brl(subtotalShown)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-muted">Frete</dt>
                  <dd className="tabular-nums">{brl(freightShown)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-muted">
                    Desconto
                    {(isDraft
                      ? discountMode === "PERCENTUAL"
                      : open?.discountMode === "PERCENTUAL") && (
                      <span className="ml-1 text-ink-subtle">
                        (
                        {isDraft
                          ? discountPercent
                          : (open?.discountPercent ?? 0)}
                        %)
                      </span>
                    )}
                  </dt>
                  <dd className="tabular-nums">− {brl(discountShown)}</dd>
                </div>
                <div className="flex justify-between border-t border-hairline pt-1.5 text-[15px] font-semibold text-brand-600">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{brl(totalShown)}</dd>
                </div>
              </dl>

              {open && isDraft && canManage && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="primary"
                    loading={busy}
                    disabled={busy || open.items.length === 0}
                    onClick={() => setConfirm({ kind: "finalize" })}
                  >
                    Finalizar compra (creditar estoque)
                  </Button>
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => setConfirm({ kind: "cancel" })}
                  >
                    Cancelar compra
                  </Button>
                </div>
              )}
            </SectionCard>
          </div>
        )}
      </Drawer>

      <Modal
        open={supplierModalOpen}
        onClose={() => setSupplierModalOpen(false)}
        width="lg"
        title="Novo fornecedor"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setSupplierModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              loading={savingSupplier}
              disabled={savingSupplier || !supplierForm.name.trim()}
              onClick={handleCreateSupplier}
            >
              Cadastrar
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label="Nome / Razão social"
              value={supplierForm.name}
              autoFocus
              onChange={(e) =>
                setSupplierForm({ ...supplierForm, name: e.target.value })
              }
              placeholder="Ex.: Atacadão, Distribuidora Silva…"
            />
          </div>
          <div className="sm:col-span-2">
            <DocumentField
              label="Documento"
              value={supplierForm.document}
              onChange={(document) =>
                setSupplierForm({ ...supplierForm, document })
              }
            />
          </div>
          <Input
            label="Telefone / WhatsApp"
            inputMode="tel"
            placeholder="(00) 00000-0000"
            value={supplierForm.phone}
            onChange={(e) =>
              setSupplierForm({
                ...supplierForm,
                phone: formatBrazilianPhone(e.target.value),
              })
            }
          />
          <Input
            label="E-mail"
            type="email"
            value={supplierForm.email}
            onChange={(e) =>
              setSupplierForm({ ...supplierForm, email: e.target.value })
            }
          />
          <Input
            label="Instagram"
            value={supplierForm.instagram}
            onChange={(e) =>
              setSupplierForm({ ...supplierForm, instagram: e.target.value })
            }
            placeholder="@perfil"
          />
          <div className="sm:col-span-2">
            <Input
              label="Endereço"
              value={supplierForm.address}
              onChange={(e) =>
                setSupplierForm({ ...supplierForm, address: e.target.value })
              }
            />
          </div>
        </div>
        <p className="mt-2 text-[11px] text-ink-subtle">
          O fornecedor fica disponível na página <strong>Fornecedores</strong> e
          em todas as compras da loja.
        </p>
      </Modal>

      <Modal
        open={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        width="md"
        title="Novo produto"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setProductModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              loading={savingProduct}
              disabled={savingProduct || !productForm.name.trim()}
              onClick={handleCreateProduct}
            >
              Cadastrar
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4">
          <Input
            label="Nome"
            value={productForm.name}
            autoFocus
            onChange={(e) =>
              setProductForm({ ...productForm, name: e.target.value })
            }
          />
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
                Marca (opcional)
              </span>
              <button
                type="button"
                onClick={() => {
                  setNewBrandName("");
                  setBrandModalOpen(true);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-700"
              >
                <Plus size={13} /> Nova marca
              </button>
            </div>
            <Select
              value={productForm.brand}
              onChange={(e) =>
                setProductForm({ ...productForm, brand: e.target.value })
              }
            >
              <option value="">Sem marca</option>
              {productForm.brand &&
                !brands.some((b) => b.name === productForm.brand) && (
                  <option value={productForm.brand}>{productForm.brand}</option>
                )}
              {brands.map((b) => (
                <option key={b.idBrand} value={b.name}>
                  {b.name}
                </option>
              ))}
            </Select>
          </div>
          <Select
            label="Tipo"
            value={productForm.kind}
            onChange={(e) =>
              setProductForm({
                ...productForm,
                kind: e.target.value as ProductKind,
              })
            }
          >
            {purchasableKindOptions.map((kind) => (
              <option key={kind} value={kind}>
                {kind === "INSUMO"
                  ? "Insumo (produção)"
                  : "Revenda (compra e venda)"}
              </option>
            ))}
          </Select>
          <Select
            label="Unidade de medida (estoque e receitas)"
            value={productForm.unit}
            onChange={(e) =>
              setProductForm({
                ...productForm,
                unit: e.target.value as UnitOfMeasure,
              })
            }
          >
            {unitOptions.map((unit) => (
              <option key={unit.value} value={unit.value}>
                {unitLabel[unit.value]}
              </option>
            ))}
          </Select>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Unidade de compra"
              value={productForm.packagingUnit}
              onChange={(e) =>
                setProductForm({
                  ...productForm,
                  packagingUnit: e.target.value as PackagingUnit,
                })
              }
            >
              {packagingUnitOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <NumberInput
              label={`Conteúdo por unidade (${productForm.unit})`}
              value={productForm.packSize}
              onValueChange={(packSize) =>
                setProductForm({ ...productForm, packSize })
              }
              suffix={productForm.unit}
            />
          </div>
        </div>
        <p className="mt-2 text-[11px] text-ink-subtle">
          O código (SKU) é gerado automaticamente. Ex.: 1{" "}
          {packagingUnitLabel[productForm.packagingUnit].toLowerCase()} ={" "}
          {productForm.packSize || 0} {productForm.unit}.
        </p>
      </Modal>

      <Modal
        open={brandModalOpen}
        onClose={() => setBrandModalOpen(false)}
        width="sm"
        title="Nova marca"
        footer={
          <>
            <Button variant="outline" onClick={() => setBrandModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              loading={savingBrand}
              disabled={savingBrand || !newBrandName.trim()}
              onClick={handleCreateBrand}
            >
              Cadastrar
            </Button>
          </>
        }
      >
        <Input
          label="Nome da marca"
          value={newBrandName}
          autoFocus
          onChange={(e) => setNewBrandName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleCreateBrand();
          }}
          placeholder="Ex.: Nestlé, Itambé…"
        />
        <p className="mt-2 text-[11px] text-ink-subtle">
          A marca cadastrada fica disponível para todos os produtos da loja.
        </p>
      </Modal>

      <ConfirmDialog
        open={confirm !== null}
        loading={confirmBusy}
        onCancel={() => {
          if (!confirmBusy) setConfirm(null);
        }}
        onConfirm={runConfirm}
        variant={confirm?.kind === "finalize" ? "warning" : "danger"}
        title={
          confirm?.kind === "removeItem"
            ? "Remover item"
            : confirm?.kind === "cancel"
              ? "Cancelar compra"
              : "Finalizar compra"
        }
        confirmLabel={
          confirm?.kind === "removeItem"
            ? "Remover"
            : confirm?.kind === "cancel"
              ? "Cancelar compra"
              : "Finalizar compra"
        }
        cancelLabel={confirm?.kind === "cancel" ? "Voltar" : "Cancelar"}
        description={
          confirm?.kind === "removeItem" ? (
            <>
              Remover{" "}
              <strong className="text-ink">{confirm.productName}</strong> desta
              compra?
            </>
          ) : confirm?.kind === "cancel" ? (
            "A compra será marcada como cancelada e não poderá mais ser editada nem finalizada."
          ) : (
            "Os itens entram no estoque com o custo informado e a compra não poderá mais ser editada."
          )
        }
      />
    </div>
  );
}
