import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import DataTable from "@/components/organisms/DataTable";
import FilterBar from "@/components/molecules/FilterBar";
import FilterPanel from "@/components/molecules/FilterPanel";
import Pagination from "@/components/molecules/Pagination";
import Select from "@/components/atoms/Select";
import Button from "@/components/atoms/Button";
import Drawer from "@/components/organisms/Drawer";
import {
  fetchUserFilterOptions,
  getUserTableColumns,
  userGroupSelectOptions,
  userUiCopy,
} from "@/features/users";
import type { UserFilterOption } from "@/api/users/schema";
import { useUsersContext } from "@/features/users/context/useUsersContext";
import UserForm from "./UserForm";

function uniqueSorted(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(values.filter((value): value is string => !!value)),
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export default function Users() {
  const {
    users,
    loading,
    pagination,
    filters,
    setFilters,
    clearFilters,
    setLimit,
    setPage,
    load,
  } = useUsersContext();

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [editingUserId, setEditingUserId] = useState<string | undefined>();

  function openCreate() {
    setDrawerMode("create");
    setEditingUserId(undefined);
    setDrawerOpen(true);
  }

  function openEdit(idUsers: string) {
    setDrawerMode("edit");
    setEditingUserId(idUsers);
    setDrawerOpen(true);
  }

  function handleDone() {
    setDrawerOpen(false);
    void load();
  }

  const [filterOptions, setFilterOptions] = useState<UserFilterOption[]>([]);

  useEffect(() => {
    let cancelled = false;

    void fetchUserFilterOptions()
      .then((options) => {
        if (!cancelled) {
          setFilterOptions(options);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFilterOptions([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const nameOptions = useMemo(
    () => uniqueSorted(filterOptions.map((option) => option.name)),
    [filterOptions],
  );
  const emailOptions = useMemo(
    () => uniqueSorted(filterOptions.map((option) => option.email)),
    [filterOptions],
  );
  const usernameOptions = useMemo(
    () => uniqueSorted(filterOptions.map((option) => option.username)),
    [filterOptions],
  );

  // The eye column is provided by DataTable's onView; drop the built-in
  // actions column (index 0) from the shared column set.
  const columns = useMemo(
    () => getUserTableColumns({ onEdit: () => {} }).slice(1),
    [],
  );

  return (
    <div className="space-y-4">
      <FilterBar
        action={{
          label: userUiCopy.listing.newAction,
          onClick: openCreate,
          leftIcon: <Plus size={16} />,
        }}
      />

      <FilterPanel hasActiveFilters={Object.values(filters).some(Boolean)}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <Select
            label="Nome"
            value={filters.name}
            onChange={(event) => {
              void setFilters({ name: event.target.value });
            }}
          >
            <option value="">Todos</option>
            {nameOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>

          <Select
            label="Email"
            value={filters.email}
            onChange={(event) => {
              void setFilters({ email: event.target.value });
            }}
          >
            <option value="">Todos</option>
            {emailOptions.map((email) => (
              <option key={email} value={email}>
                {email}
              </option>
            ))}
          </Select>

          <Select
            label="Username"
            value={filters.username}
            onChange={(event) => {
              void setFilters({ username: event.target.value });
            }}
          >
            <option value="">Todos</option>
            {usernameOptions.map((username) => (
              <option key={username} value={username}>
                {username}
              </option>
            ))}
          </Select>

          <Select
            label="Grupo"
            value={filters.group}
            onChange={(event) => {
              void setFilters({
                group: event.target.value as typeof filters.group,
              });
            }}
          >
            <option value="">Todos</option>
            {userGroupSelectOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Select
            label="Ativo"
            value={filters.status}
            onChange={(event) => {
              void setFilters({
                status: event.target.value as typeof filters.status,
              });
            }}
          >
            <option value="">Todos</option>
            <option value="true">Ativo</option>
            <option value="false">Inativo</option>
          </Select>

          <div className="flex items-end justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                void clearFilters();
              }}
            >
              Limpar filtros
            </Button>
          </div>
        </div>
      </FilterPanel>

      {loading ? (
        <div className="flex h-56 items-center justify-center">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-gold-500 border-t-transparent" />
        </div>
      ) : (
        <>
          <DataTable
            data={users}
            columns={columns}
            emptyMessage={userUiCopy.listing.emptyMessage}
            getId={(user) => user.idUsers}
            onView={(user) => openEdit(user.idUsers)}
            viewLabel="Ver / editar usuário"
          />
          <Pagination
            page={pagination.currentPage}
            pageCount={pagination.totalPages}
            total={pagination.total}
            pageSize={pagination.limit}
            disabled={loading}
            onPageChange={(next) => {
              void setPage(next);
            }}
            onPageSizeChange={(size) => {
              void setLimit(size);
            }}
          />
        </>
      )}

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width="lg"
        title={
          drawerMode === "create"
            ? userUiCopy.form.createTitle
            : userUiCopy.form.editTitle
        }
      >
        {drawerOpen && (
          <UserForm
            mode={drawerMode}
            userId={editingUserId}
            onDone={handleDone}
          />
        )}
      </Drawer>
    </div>
  );
}
