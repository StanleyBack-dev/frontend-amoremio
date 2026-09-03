import { useCallback, useEffect, useState } from "react";
import Button from "@atoms/Button";
import Input from "@atoms/Input";
import Select from "@atoms/Select";
import Badge from "@atoms/Badge";
import FilterPanel from "@/components/molecules/FilterPanel";
import Pagination from "@/components/molecules/Pagination";
import { useTablePagination } from "@/shared/pagination/useTablePagination";
import SectionCard from "@/components/organisms/SectionCard";
import DataTable from "@/components/organisms/DataTable";
import Drawer from "@/components/organisms/Drawer";
import { useToast } from "@/shared/toast/useToast";
import { useStoreContext } from "@/features/stores";
import {
  createBrand,
  fetchBrandFilterOptions,
  fetchBrands,
  updateBrand,
} from "@/features/brands";
import type {
  Brand,
  BrandFilterOptions,
  ListBrandsParams,
} from "@/api/brands/schema";
import { formatDateTimeDisplay } from "@/utils/format";

interface FormState {
  idBrand: string | null;
  name: string;
  status: boolean;
}

const emptyForm: FormState = { idBrand: null, name: "", status: true };

const emptyFilters = {
  name: "",
  status: "",
  createdBy: "",
};

export default function Brands() {
  const { showError, showSuccess } = useToast();
  const { activeStore, activeStoreId } = useStoreContext();
  const canManage =
    activeStore?.role === "DONO" ||
    activeStore?.role === "GERENTE" ||
    activeStore?.role === null;

  const [brands, setBrands] = useState<Brand[]>([]);
  const [filterOptions, setFilterOptions] = useState<BrandFilterOptions>({
    names: [],
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
  const [form, setForm] = useState<FormState>(emptyForm);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const patchFilters = (patch: Partial<typeof emptyFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    resetListPage();
  };
  const clearFilters = () => {
    setFilters(emptyFilters);
    resetListPage();
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  // Build the backend query params from the current filter selection.
  // Every brand filter is resolved server-side; nothing is filtered on the client.
  const buildListParams = useCallback((): ListBrandsParams => {
    const params: ListBrandsParams = {
      idStore: activeStoreId as string,
      page: listPage,
      limit: listLimit,
    };
    if (filters.name) params.name = filters.name;
    if (filters.status) params.status = filters.status === "true";
    if (filters.createdBy) params.createdByUserId = filters.createdBy;
    return params;
  }, [activeStoreId, filters, listPage, listLimit]);

  const load = useCallback(async () => {
    if (!activeStoreId) {
      setBrands([]);
      return;
    }
    setLoading(true);
    try {
      const result = await fetchBrands(buildListParams());
      setBrands(result.items);
      setListMeta({
        total: result.pagination.total,
        totalPages: result.pagination.totalPages,
      });
    } catch (error) {
      showError(
        "Erro ao listar marcas",
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
      setFilterOptions({ names: [], creators: [] });
      return;
    }
    try {
      setFilterOptions(await fetchBrandFilterOptions(activeStoreId));
    } catch {
      // the filter selects just fall back to an empty option list
      setFilterOptions({ names: [], creators: [] });
    }
  }, [activeStoreId]);

  useEffect(() => {
    void loadFilterOptions();
  }, [loadFilterOptions]);

  function openCreate() {
    setForm(emptyForm);
    setDrawerOpen(true);
  }

  function openEdit(brand: Brand) {
    setForm({ idBrand: brand.idBrand, name: brand.name, status: brand.status });
    setDrawerOpen(true);
  }

  async function handleSave() {
    if (!activeStoreId) return;
    const name = form.name.trim();
    if (!name) return;

    setSaving(true);
    try {
      if (form.idBrand) {
        await updateBrand({
          idStore: activeStoreId,
          idBrand: form.idBrand,
          name,
          status: form.status,
        });
        showSuccess("Marca atualizada", "");
      } else {
        await createBrand({ idStore: activeStoreId, name });
        showSuccess("Marca criada", "");
      }
      setDrawerOpen(false);
      setForm(emptyForm);
      await Promise.all([load(), loadFilterOptions()]);
    } catch (error) {
      showError(
        "Erro ao salvar marca",
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
            para gerenciar as marcas.
          </p>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionCard
        title="Marcas"
        action={
          canManage ? (
            <Button variant="primary" onClick={openCreate}>
              Nova marca
            </Button>
          ) : undefined
        }
      >
        <FilterPanel hasActiveFilters={hasActiveFilters}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Select
              label="Nome"
              value={filters.name}
              onChange={(e) => patchFilters({ name: e.target.value })}
            >
              <option value="">Todas</option>
              {filterOptions.names.map((name) => (
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
              <option value="true">Ativa</option>
              <option value="false">Inativa</option>
            </Select>

            <Select
              label="Criada por"
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
          data={brands}
          getId={(row) => row.idBrand}
          emptyMessage={
            loading
              ? "Carregando..."
              : hasActiveFilters
                ? "Nenhuma marca para os filtros aplicados."
                : "Nenhuma marca cadastrada."
          }
          onView={openEdit}
          viewLabel="Ver / editar marca"
          columns={[
            { key: "name", label: "Nome" },
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
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setForm(emptyForm);
        }}
        title={
          form.idBrand ? (canManage ? "Editar marca" : "Marca") : "Nova marca"
        }
        footer={
          canManage ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setDrawerOpen(false);
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
                setDrawerOpen(false);
                setForm(emptyForm);
              }}
            >
              Fechar
            </Button>
          )
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Nome da marca"
            value={form.name}
            disabled={!canManage}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ex.: Nestlé, Itambé…"
          />
          {form.idBrand && (
            <Select
              label="Situação"
              value={form.status ? "true" : "false"}
              disabled={!canManage}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value === "true" })
              }
            >
              <option value="true">Ativa</option>
              <option value="false">Inativa</option>
            </Select>
          )}
        </div>
      </Drawer>
    </div>
  );
}
