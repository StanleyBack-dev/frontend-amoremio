import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type {
  CreateUserPayload,
  UpdateUserPayload,
  User,
  UserGroup,
} from "../../api/users/schema";
import type { PaginationMeta } from "../../api/shared/contracts";
import {
  fetchUsers,
  saveUser,
  unlockUserCredential,
} from "../../features/users/services/user.service";
import { userUiCopy } from "../../features/users/model/messages";
import { useToast } from "../../shared/toast/useToast";

interface UserFilters {
  name: string;
  email: string;
  username: string;
  group: "" | UserGroup;
  status: "" | "true" | "false";
}

export interface UseUsersResult {
  users: User[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  pagination: PaginationMeta;
  filters: UserFilters;
  load: () => Promise<void>;
  setPage: (page: number) => Promise<void>;
  setLimit: (limit: number) => Promise<void>;
  setFilters: (filters: Partial<UserFilters>) => Promise<void>;
  clearFilters: () => Promise<void>;
  nextPage: () => Promise<void>;
  prevPage: () => Promise<void>;
  save: (
    formData: CreateUserPayload | UpdateUserPayload,
    editing?: User | null,
  ) => Promise<User | null>;
  unlock: (idUsers: string) => Promise<void>;
}

const DEFAULT_LIMIT = 15;

const EMPTY_PAGINATION: PaginationMeta = {
  total: 0,
  currentPage: 1,
  limit: DEFAULT_LIMIT,
  totalPages: 0,
  hasNextPage: false,
};

function toPositiveInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function readFilters(searchParams: URLSearchParams): UserFilters {
  return {
    name: searchParams.get("name") || "",
    email: searchParams.get("email") || "",
    username: searchParams.get("username") || "",
    group: (searchParams.get("group") || "") as UserFilters["group"],
    status: (searchParams.get("status") || "") as UserFilters["status"],
  };
}

function applyOptionalSearchParam(
  params: URLSearchParams,
  key: string,
  value?: string,
) {
  if (value) {
    params.set(key, value);
    return;
  }

  params.delete(key);
}

export function useUsers(): UseUsersResult {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] =
    useState<PaginationMeta>(EMPTY_PAGINATION);
  const { showError, showSuccess } = useToast();

  const currentPage = toPositiveInt(searchParams.get("page"), 1);
  const currentLimit = toPositiveInt(searchParams.get("limit"), DEFAULT_LIMIT);
  const filters = useMemo(() => readFilters(searchParams), [searchParams]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchUsers({
        page: currentPage,
        limit: currentLimit,
        name: filters.name || undefined,
        email: filters.email || undefined,
        username: filters.username || undefined,
        group: filters.group || undefined,
        status: filters.status ? filters.status === "true" : undefined,
      });
      setUsers(data.items);
      setPagination(data.pagination);
    } catch (err) {
      const message = toErrorMessage(err, userUiCopy.errors.loadUsersFallback);
      setError(message);
      showError(userUiCopy.errors.loadUsersFallback, message);
    } finally {
      setLoading(false);
    }
  }, [
    currentLimit,
    currentPage,
    filters.email,
    filters.group,
    filters.name,
    filters.status,
    filters.username,
    showError,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  const setPage = useCallback(
    async (page: number) => {
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous);
        next.set("page", String(Math.max(1, page)));
        next.set("limit", String(currentLimit));
        return next;
      });
    },
    [currentLimit, setSearchParams],
  );

  const setLimit = useCallback(
    async (limit: number) => {
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous);
        next.set("page", "1");
        next.set("limit", String(Math.max(1, limit)));
        return next;
      });
    },
    [setSearchParams],
  );

  const setFilters = useCallback(
    async (nextFilters: Partial<UserFilters>) => {
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous);
        const merged = { ...readFilters(previous), ...nextFilters };

        next.set("page", "1");
        next.set("limit", String(currentLimit));
        applyOptionalSearchParam(next, "name", merged.name);
        applyOptionalSearchParam(next, "email", merged.email);
        applyOptionalSearchParam(next, "username", merged.username);
        applyOptionalSearchParam(next, "group", merged.group);
        applyOptionalSearchParam(next, "status", merged.status);
        return next;
      });
    },
    [currentLimit, setSearchParams],
  );

  const clearFilters = useCallback(async () => {
    await setFilters({
      name: "",
      email: "",
      username: "",
      group: "",
      status: "",
    });
  }, [setFilters]);

  const nextPage = useCallback(async () => {
    if (pagination.hasNextPage) {
      await setPage(pagination.currentPage + 1);
    }
  }, [pagination.currentPage, pagination.hasNextPage, setPage]);

  const prevPage = useCallback(async () => {
    if (pagination.currentPage > 1) {
      await setPage(pagination.currentPage - 1);
    }
  }, [pagination.currentPage, setPage]);

  const save = useCallback<UseUsersResult["save"]>(
    async (formData, editing) => {
      setSaving(true);
      setError(null);

      try {
        const saved = await saveUser({ formData, editing });
        showSuccess(
          editing
            ? userUiCopy.success.updateUser
            : userUiCopy.success.createUser,
        );
        await load();
        return saved;
      } catch (err) {
        const message = toErrorMessage(err, userUiCopy.errors.saveUserFallback);
        setError(message);
        showError(userUiCopy.errors.saveUserFallback, message);
        return null;
      } finally {
        setSaving(false);
      }
    },
    [load, showError, showSuccess],
  );

  const unlock = useCallback(
    async (idUsers: string) => {
      setSaving(true);
      try {
        await unlockUserCredential(idUsers);
        showSuccess(userUiCopy.success.unlockUser);
        await load();
      } catch (err) {
        const message = toErrorMessage(
          err,
          userUiCopy.errors.unlockUserFallback,
        );
        showError(userUiCopy.errors.unlockUserFallback, message);
      } finally {
        setSaving(false);
      }
    },
    [load, showError, showSuccess],
  );

  return {
    users,
    loading,
    saving,
    error,
    pagination,
    filters,
    load,
    setPage,
    setLimit,
    setFilters,
    clearFilters,
    nextPage,
    prevPage,
    save,
    unlock,
  };
}
