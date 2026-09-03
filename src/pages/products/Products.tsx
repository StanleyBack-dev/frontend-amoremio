import { useCallback, useEffect, useState } from "react";
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
import { useTablePagination } from "@/shared/pagination/useTablePagination";
import { useToast } from "@/shared/toast/useToast";
import { formatDateTimeDisplay } from "@/utils/format";
import { useStoreContext } from "@/features/stores";
import {
  createProduct,
  fetchProductFilterOptions,
  fetchProducts,
  kindOptions,
  kindShortLabel,
  kindTone,
  packagingUnitLabel,
  packagingUnitOptions,
  unitLabel,
  unitOptions,
  updateProduct,
} from "@/features/catalog";
import { createBrand, fetchBrands } from "@/features/brands";
import type { Brand } from "@/api/brands/schema";
import type {
  ListProductsParams,
  PackagingUnit,
  Product,
  ProductFilterOptions,
  ProductKind,
  UnitOfMeasure,
} from "@/api/catalog/schema";

const brl = (value: number | null | undefined) =>
  value === null || value === undefined
    ? "—"
    : new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(value);

interface FormState {
  idProduct: string | null;
  name: string;
  sku: string;
  brand: string;
  kind: ProductKind;
  unit: UnitOfMeasure;
  packagingUnit: PackagingUnit;
  packSize: number;
  salePrice: number;
  status: boolean;
}

const emptyForm: FormState = {
  idProduct: null,
  name: "",
  sku: "",
  brand: "",
  kind: "INSUMO",
  unit: "UN",
  packagingUnit: "UNIDADE",
  packSize: 1,
  salePrice: 0,
  status: true,
};

const NO_BRAND = "__none__";

const emptyFilters = {
  name: "",
  brand: "",
  kind: "",
  unit: "",
  status: "",
  createdBy: "",
};

export default function Products() {
  const { showError, showSuccess } = useToast();
  const { activeStore, activeStoreId } = useStoreContext();
  const canManage =
    activeStore?.role === "DONO" ||
    activeStore?.role === "GERENTE" ||
    activeStore?.role === null;

  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filterOptions, setFilterOptions] = useState<ProductFilterOptions>({
    names: [],
    brands: [],
    creators: [],
  });
  const [loading, setLoading] = useState(false);
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
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [savingBrand, setSavingBrand] = useState(false);

  const loadBrands = useCallback(async () => {
    if (!activeStoreId) {
      setBrands([]);
      return;
    }
    try {
      const result = await fetchBrands({
        idStore: activeStoreId,
        limit: 500,
        status: true,
      });
      setBrands(result.items);
    } catch {
      // brand picker just falls back to a free-text-less empty list
      setBrands([]);
    }
  }, [activeStoreId]);

  useEffect(() => {
    void loadBrands();
  }, [loadBrands]);

  async function handleCreateBrand() {
    if (!activeStoreId) return;
    const name = newBrandName.trim();
    if (!name) return;
    setSavingBrand(true);
    try {
      const created = await createBrand({ idStore: activeStoreId, name });
      await loadBrands();
      setForm((current) => ({ ...current, brand: created.name }));
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

  // Build the backend query params from the current filter selection.
  // Every product filter is resolved server-side; nothing is filtered on the client.
  const buildListParams = useCallback((): ListProductsParams => {
    const params: ListProductsParams = {
      idStore: activeStoreId as string,
      page: listPage,
      limit: listLimit,
    };
    if (filters.name) params.name = filters.name;
    if (filters.brand === NO_BRAND) {
      params.withoutBrand = true;
    } else if (filters.brand) {
      params.brand = filters.brand;
    }
    if (filters.kind) params.kinds = [filters.kind as ProductKind];
    if (filters.unit) params.unit = filters.unit as UnitOfMeasure;
    if (filters.status) params.status = filters.status === "true";
    if (filters.createdBy) params.createdByUserId = filters.createdBy;
    return params;
  }, [activeStoreId, filters, listPage, listLimit]);

  const load = useCallback(async () => {
    if (!activeStoreId) {
      setProducts([]);
      return;
    }
    setLoading(true);
    try {
      const result = await fetchProducts(buildListParams());
      setProducts(result.items);
      setListMeta({
        total: result.pagination.total,
        totalPages: result.pagination.totalPages,
      });
    } catch (error) {
      showError(
        "Erro ao listar produtos",
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
      setFilterOptions({ names: [], brands: [], creators: [] });
      return;
    }
    try {
      setFilterOptions(await fetchProductFilterOptions(activeStoreId));
    } catch {
      // the filter selects just fall back to an empty option list
      setFilterOptions({ names: [], brands: [], creators: [] });
    }
  }, [activeStoreId]);

  useEffect(() => {
    void loadFilterOptions();
  }, [loadFilterOptions]);

  const nameOptions = filterOptions.names;
  const brandOptions = filterOptions.brands;
  const creatorOptions = filterOptions.creators;

  const hasActiveFilters = Object.values(filters).some(Boolean);

  function openCreate() {
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(product: Product) {
    setForm({
      idProduct: product.idProduct,
      name: product.name,
      sku: product.sku ?? "",
      brand: product.brand ?? "",
      kind: product.kind,
      unit: product.unit,
      packagingUnit: product.packagingUnit ?? "UNIDADE",
      packSize: product.packSize ?? 1,
      salePrice: product.salePrice ?? 0,
      status: product.status,
    });
    setFormOpen(true);
  }

  async function handleSave() {
    if (!activeStoreId) return;
    const name = form.name.trim();
    if (!name) return;
    const salePrice = form.salePrice > 0 ? form.salePrice : undefined;

    setSaving(true);
    try {
      if (form.idProduct) {
        await updateProduct({
          idStore: activeStoreId,
          idProduct: form.idProduct,
          name,
          brand: form.brand.trim() || undefined,
          kind: form.kind,
          unit: form.unit,
          packagingUnit: form.packagingUnit,
          packSize: form.packSize > 0 ? form.packSize : 1,
          salePrice,
          status: form.status,
        });
        showSuccess("Produto atualizado", "");
      } else {
        await createProduct({
          idStore: activeStoreId,
          name,
          brand: form.brand.trim() || undefined,
          kind: form.kind,
          unit: form.unit,
          packagingUnit: form.packagingUnit,
          packSize: form.packSize > 0 ? form.packSize : 1,
          salePrice,
        });
        showSuccess(
          "Produto criado",
          "O código (SKU) foi gerado automaticamente.",
        );
      }
      setFormOpen(false);
      setForm(emptyForm);
      await Promise.all([load(), loadFilterOptions()]);
    } catch (error) {
      showError(
        "Erro ao salvar produto",
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
            para gerenciar o catálogo.
          </p>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionCard
        title="Catálogo"
        action={
          canManage ? (
            <Button variant="primary" onClick={openCreate}>
              Novo produto
            </Button>
          ) : undefined
        }
      >
        <FilterPanel hasActiveFilters={hasActiveFilters}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <Select
              label="Nome"
              value={filters.name}
              onChange={(e) => patchFilters({ name: e.target.value })}
            >
              <option value="">Todos</option>
              {nameOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>

            <Select
              label="Marca"
              value={filters.brand}
              onChange={(e) =>
                patchFilters({ brand: e.target.value })
              }
            >
              <option value="">Todas</option>
              <option value={NO_BRAND}>Sem marca</option>
              {brandOptions.map((brand) => (
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
              onChange={(e) =>
                patchFilters({ status: e.target.value })
              }
            >
              <option value="">Todas</option>
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </Select>

            <Select
              label="Criado por"
              value={filters.createdBy}
              onChange={(e) =>
                patchFilters({ createdBy: e.target.value })
              }
            >
              <option value="">Todos</option>
              {creatorOptions.map((creator) => (
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
          data={products}
          getId={(row) => row.idProduct}
          emptyMessage={
            loading
              ? "Carregando..."
              : hasActiveFilters
                ? "Nenhum produto para os filtros aplicados."
                : "Nenhum produto cadastrado."
          }
          onView={openEdit}
          viewLabel="Ver / editar produto"
          columns={[
            { key: "name", label: "Nome" },
            {
              key: "brand",
              label: "Marca",
              render: (row) => row.brand ?? "—",
            },
            {
              key: "sku",
              label: "SKU",
              render: (row) => row.sku ?? "—",
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
              key: "unit",
              label: "Medida",
              render: (row) => unitLabel[row.unit],
            },
            {
              key: "packaging",
              label: "Compra",
              render: (row) =>
                row.packSize && row.packSize !== 1
                  ? `${packagingUnitLabel[row.packagingUnit]} · ${row.packSize} ${row.unit}`
                  : packagingUnitLabel[row.packagingUnit],
            },
            {
              key: "salePrice",
              label: "Preço de venda",
              className: "tabular-nums",
              render: (row) => brl(row.salePrice),
            },
            {
              key: "status",
              label: "Situação",
              render: (row) => (
                <Badge tone={row.status ? "success" : "neutral"}>
                  {row.status ? "Ativo" : "Inativo"}
                </Badge>
              ),
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
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setForm(emptyForm);
        }}
        title={
          form.idProduct
            ? canManage
              ? "Editar produto"
              : "Produto"
            : "Novo produto"
        }
        subtitle={form.idProduct ? (form.sku ?? undefined) : undefined}
        footer={
          canManage ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setFormOpen(false);
                  setForm(emptyForm);
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                loading={saving}
                disabled={saving || !form.name.trim()}
                onClick={handleSave}
              >
                Salvar
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              onClick={() => {
                setFormOpen(false);
                setForm(emptyForm);
              }}
            >
              Fechar
            </Button>
          )
        }
      >
        <div className="grid grid-cols-1 gap-4">
          <Input
            label="Nome"
            value={form.name}
            disabled={!canManage}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
                Marca (opcional)
              </span>
              {canManage && (
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
              )}
            </div>
            <Select
              value={form.brand}
              disabled={!canManage}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
            >
              <option value="">Sem marca</option>
              {form.brand && !brands.some((b) => b.name === form.brand) && (
                <option value={form.brand}>{form.brand}</option>
              )}
              {brands.map((b) => (
                <option key={b.idBrand} value={b.name}>
                  {b.name}
                </option>
              ))}
            </Select>
          </div>
          <Select
            label="Tipo de produto"
            value={form.kind}
            disabled={!canManage}
            onChange={(e) =>
              setForm({ ...form, kind: e.target.value as ProductKind })
            }
          >
            {kindOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select
            label="Unidade de medida (estoque e receitas)"
            value={form.unit}
            disabled={!canManage}
            onChange={(e) =>
              setForm({ ...form, unit: e.target.value as UnitOfMeasure })
            }
          >
            {unitOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Unidade de compra"
              value={form.packagingUnit}
              disabled={!canManage}
              onChange={(e) =>
                setForm({
                  ...form,
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
              label="Conteúdo por unidade de compra"
              value={form.packSize}
              disabled={!canManage}
              onValueChange={(packSize) => setForm({ ...form, packSize })}
              suffix={form.unit}
              hint={`1 ${packagingUnitLabel[form.packagingUnit].toLowerCase()} = ${
                form.packSize || 0
              } ${form.unit}`}
            />
          </div>
          <CurrencyInput
            label="Preço de venda (opcional)"
            value={form.salePrice}
            disabled={!canManage}
            onValueChange={(salePrice) => setForm({ ...form, salePrice })}
          />
          {form.idProduct ? (
            <>
              <Input label="SKU (gerado)" value={form.sku} disabled />
              <Select
                label="Situação"
                value={form.status ? "true" : "false"}
                disabled={!canManage}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value === "true" })
                }
              >
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </Select>
            </>
          ) : (
            <p className="text-[11px] text-ink-subtle">
              O código (SKU) é gerado automaticamente a partir do nome.
            </p>
          )}
        </div>
      </Drawer>

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
    </div>
  );
}
