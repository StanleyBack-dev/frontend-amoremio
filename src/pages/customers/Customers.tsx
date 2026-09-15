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
import { useLoading } from "@/shared/loading";
import { useStoreContext } from "@/features/stores";
import { formatBrazilianPhone } from "@/utils/format";
import {
  createCustomer,
  fetchCustomerFilterOptions,
  fetchCustomers,
  updateCustomer,
} from "@/features/customers";
import type {
  Customer,
  CustomerFilterOptions,
  ListCustomersParams,
} from "@/api/customers/schema";
import { formatDateTimeDisplay } from "@/utils/format";

interface FormState {
  idCustomer: string | null;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  status: boolean;
}

const emptyForm: FormState = {
  idCustomer: null,
  name: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
  status: true,
};

const emptyFilters = {
  name: "",
  status: "",
  createdBy: "",
};

function toForm(customer: Customer): FormState {
  return {
    idCustomer: customer.idCustomer,
    name: customer.name,
    phone: formatBrazilianPhone(customer.phone ?? ""),
    email: customer.email ?? "",
    address: customer.address ?? "",
    notes: customer.notes ?? "",
    status: customer.status,
  };
}

export default function Customers() {
  const { showError, showSuccess } = useToast();
  const { track } = useLoading();
  const { activeStore, activeStoreId } = useStoreContext();
  const canManage =
    activeStore?.role === "DONO" ||
    activeStore?.role === "GERENTE" ||
    activeStore?.role === "FUNCIONARIO" ||
    activeStore?.role === null;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filterOptions, setFilterOptions] = useState<CustomerFilterOptions>({
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

  // Every customer filter is resolved server-side; nothing is client-filtered.
  const buildListParams = useCallback((): ListCustomersParams => {
    const params: ListCustomersParams = {
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
      setCustomers([]);
      return;
    }
    setLoading(true);
    try {
      const result = await fetchCustomers(buildListParams());
      setCustomers(result.items);
      setListMeta({
        total: result.pagination.total,
        totalPages: result.pagination.totalPages,
      });
    } catch (error) {
      showError(
        "Erro ao listar clientes",
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
      setFilterOptions(await fetchCustomerFilterOptions(activeStoreId));
    } catch {
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

  function openEdit(customer: Customer) {
    setForm(toForm(customer));
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setForm(emptyForm);
  }

  async function handleSave() {
    if (!activeStoreId) return;
    const name = form.name.trim();
    if (!name) return;

    setSaving(true);
    try {
      const payload = {
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };
      if (form.idCustomer) {
        await track(
          updateCustomer({
            idStore: activeStoreId,
            idCustomer: form.idCustomer,
            name,
            status: form.status,
            ...payload,
          }),
        );
        showSuccess("Cliente atualizado", "");
      } else {
        await track(
          createCustomer({ idStore: activeStoreId, name, ...payload }),
        );
        showSuccess("Cliente criado", "");
      }
      closeDrawer();
      await Promise.all([load(), loadFilterOptions()]);
    } catch (error) {
      showError(
        "Erro ao salvar cliente",
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
            para gerenciar os clientes.
          </p>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionCard
        title="Clientes"
        action={
          canManage ? (
            <Button variant="primary" onClick={openCreate}>
              Novo cliente
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
              <option value="">Todos</option>
              {filterOptions.names.map((name) => (
                <option key={name} value={name}>
                  {name}
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
          data={customers}
          getId={(row) => row.idCustomer}
          emptyMessage={
            loading
              ? "Carregando..."
              : hasActiveFilters
                ? "Nenhum cliente para os filtros aplicados."
                : "Nenhum cliente cadastrado."
          }
          onView={openEdit}
          viewLabel="Ver / editar cliente"
          columns={[
            { key: "name", label: "Nome" },
            {
              key: "phone",
              label: "Telefone",
              render: (row) => row.phone ?? "—",
            },
            {
              key: "email",
              label: "E-mail",
              render: (row) => row.email ?? "—",
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
            {
              key: "updatedAt",
              label: "Atualizado em",
              className: "tabular-nums",
              render: (row) => formatDateTimeDisplay(row.updatedAt),
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
        onClose={closeDrawer}
        title={
          form.idCustomer
            ? canManage
              ? "Editar cliente"
              : "Cliente"
            : "Novo cliente"
        }
        footer={
          canManage ? (
            <>
              <Button variant="outline" onClick={closeDrawer}>
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
            <Button variant="outline" onClick={closeDrawer}>
              Fechar
            </Button>
          )
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Nome"
            value={form.name}
            disabled={!canManage}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ex.: Anna Luiza"
          />
          <Input
            label="Telefone / WhatsApp"
            inputMode="tel"
            placeholder="(00) 00000-0000"
            value={form.phone}
            disabled={!canManage}
            onChange={(e) =>
              setForm({ ...form, phone: formatBrazilianPhone(e.target.value) })
            }
          />
          <Input
            label="E-mail"
            type="email"
            value={form.email}
            disabled={!canManage}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Endereço"
            value={form.address}
            disabled={!canManage}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <div className="sm:col-span-2">
            <Input
              label="Observações"
              value={form.notes}
              disabled={!canManage}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Preferências, restrições, endereço de entrega…"
            />
          </div>
          {form.idCustomer && (
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
          )}
        </div>
      </Drawer>
    </div>
  );
}
