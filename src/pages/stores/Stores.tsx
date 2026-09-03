import { useCallback, useEffect, useMemo, useState } from "react";
import { Instagram, Mail, MessageCircle, ShoppingBag, Utensils } from "lucide-react";
import Button from "@atoms/Button";
import Input from "@atoms/Input";
import Select from "@atoms/Select";
import SectionCard from "@/components/organisms/SectionCard";
import ContactField from "@/components/molecules/ContactField";
import { useToast } from "@/shared/toast/useToast";
import { useStoreContext } from "@/features/stores";
import {
  addStoreMember,
  createStore,
  fetchStoreMembers,
  removeStoreMember,
  updateStore,
  updateStoreMemberRole,
} from "@/features/stores";
import {
  storeRoleLabel,
  storeRoleOptions,
} from "@/features/stores/model/roles";
import type { Store, StoreMember, StoreRole } from "@/api/stores/schema";
import { fetchUsers } from "@/features/users";
import type { User } from "@/api/users/schema";
import { formatBrazilianPhone, formatCNPJ } from "@/utils/format";
import { isValidCNPJ } from "@/utils/validators";

type StoreForm = {
  name: string;
  legalName: string;
  cnpj: string;
  whatsapp: string;
  email: string;
  instagram: string;
  ifoodUrl: string;
  food99Url: string;
};

const EMPTY_FORM: StoreForm = {
  name: "",
  legalName: "",
  cnpj: "",
  whatsapp: "",
  email: "",
  instagram: "",
  ifoodUrl: "",
  food99Url: "",
};

function digits(value: string): string {
  return value.replace(/\D/g, "");
}

// Stored WhatsApp is digits only, sometimes already carrying the "55" country
// code. Show the local (DDD + number) part masked.
function displayWhatsapp(stored?: string | null): string {
  if (!stored) return "";
  let local = digits(stored);
  if (local.length > 11 && local.startsWith("55")) {
    local = local.slice(2);
  }
  return formatBrazilianPhone(local);
}

function whatsappHref(masked: string): string | null {
  const local = digits(masked);
  if (local.length < 10) return null;
  return `https://wa.me/55${local}`;
}

function instagramHandle(value: string): string {
  return value
    .trim()
    .replace(/^@+/, "")
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/\/+$/, "");
}

function instagramHref(value: string): string | null {
  const handle = instagramHandle(value);
  return handle ? `https://instagram.com/${handle}` : null;
}

function externalHref(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function mailtoHref(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? `mailto:${trimmed}` : null;
}

function storeToForm(store: Store): StoreForm {
  return {
    name: store.name ?? "",
    legalName: store.legalName ?? "",
    cnpj: store.cnpj ? formatCNPJ(store.cnpj) : "",
    whatsapp: displayWhatsapp(store.whatsapp),
    email: store.email ?? "",
    instagram: store.instagram ?? "",
    ifoodUrl: store.ifoodUrl ?? "",
    food99Url: store.food99Url ?? "",
  };
}

export default function Stores() {
  const { showError, showSuccess } = useToast();
  const { stores, activeStore, activeStoreId, setActiveStore, reloadStores } =
    useStoreContext();

  const [newStoreName, setNewStoreName] = useState("");
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState<StoreForm>(EMPTY_FORM);
  const [savedForm, setSavedForm] = useState<StoreForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [members, setMembers] = useState<StoreMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [newMemberUserId, setNewMemberUserId] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<StoreRole>("FUNCIONARIO");
  const [addingMember, setAddingMember] = useState(false);

  const canManage = activeStore?.role === "DONO" || activeStore?.role === null;

  useEffect(() => {
    const next = activeStore ? storeToForm(activeStore) : EMPTY_FORM;
    setForm(next);
    setSavedForm(next);
  }, [activeStore]);

  const updateField = useCallback(
    (field: keyof StoreForm, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const cnpjDigits = digits(form.cnpj);
  const cnpjError =
    cnpjDigits.length > 0 && (cnpjDigits.length !== 14 || !isValidCNPJ(cnpjDigits))
      ? "CNPJ inválido."
      : "";

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(savedForm),
    [form, savedForm],
  );

  const loadMembers = useCallback(async () => {
    if (!activeStoreId) {
      setMembers([]);
      return;
    }
    setMembersLoading(true);
    try {
      setMembers(await fetchStoreMembers(activeStoreId));
    } catch (error) {
      showError(
        "Erro ao carregar membros",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    } finally {
      setMembersLoading(false);
    }
  }, [activeStoreId, showError]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    if (!canManage) return;
    fetchUsers({ limit: 100 })
      .then((result) => setUsers(result.items))
      .catch(() => setUsers([]));
  }, [canManage]);

  async function handleCreate() {
    const name = newStoreName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const store = await createStore({ name });
      showSuccess("Loja criada", `"${store.name}" foi criada.`);
      setNewStoreName("");
      await reloadStores();
      setActiveStore(store.idStore);
    } catch (error) {
      showError(
        "Erro ao criar loja",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleSave() {
    if (!activeStoreId) return;
    if (!form.name.trim()) {
      showError("Nome obrigatório", "Informe o nome da loja.");
      return;
    }
    if (cnpjError) {
      showError("CNPJ inválido", "Corrija o CNPJ antes de salvar.");
      return;
    }
    setSaving(true);
    try {
      await updateStore({
        idStore: activeStoreId,
        name: form.name.trim(),
        legalName: form.legalName.trim(),
        cnpj: cnpjDigits,
        whatsapp: digits(form.whatsapp),
        email: form.email.trim(),
        instagram: instagramHandle(form.instagram),
        ifoodUrl: form.ifoodUrl.trim(),
        food99Url: form.food99Url.trim(),
      });
      showSuccess("Loja atualizada", "Os dados da loja foram salvos.");
      await reloadStores();
    } catch (error) {
      showError(
        "Erro ao atualizar loja",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleAddMember() {
    if (!activeStoreId || !newMemberUserId) return;
    setAddingMember(true);
    try {
      const updated = await addStoreMember({
        idStore: activeStoreId,
        idUsers: newMemberUserId,
        role: newMemberRole,
      });
      setMembers(updated);
      setNewMemberUserId("");
      showSuccess("Membro adicionado", "O usuário agora faz parte da loja.");
    } catch (error) {
      showError(
        "Erro ao adicionar membro",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    } finally {
      setAddingMember(false);
    }
  }

  async function handleChangeRole(idUsers: string, role: StoreRole) {
    if (!activeStoreId) return;
    try {
      setMembers(
        await updateStoreMemberRole({ idStore: activeStoreId, idUsers, role }),
      );
      showSuccess("Papel atualizado", "");
    } catch (error) {
      showError(
        "Erro ao atualizar papel",
        error instanceof Error ? error.message : "Tente novamente.",
      );
      void loadMembers();
    }
  }

  async function handleRemoveMember(idUsers: string) {
    if (!activeStoreId) return;
    try {
      setMembers(await removeStoreMember(activeStoreId, idUsers));
      showSuccess("Membro removido", "");
    } catch (error) {
      showError(
        "Erro ao remover membro",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    }
  }

  const memberUserIds = new Set(members.map((member) => member.idUsers));
  const assignableUsers = users.filter(
    (user) => !memberUserIds.has(user.idUsers),
  );

  const fieldsDisabled = !canManage || saving;

  return (
    <div className="flex flex-col gap-6">
      <SectionCard title="Loja ativa">
        {stores.length === 0 ? (
          <p className="text-[13px] text-ink-muted">
            Você ainda não faz parte de nenhuma loja.
          </p>
        ) : (
          <Select
            label="Loja ativa"
            value={activeStoreId ?? ""}
            onChange={(e) => setActiveStore(e.target.value)}
          >
            {stores.map((store) => (
              <option key={store.idStore} value={store.idStore}>
                {store.name}
                {store.role ? ` — ${storeRoleLabel[store.role]}` : ""}
              </option>
            ))}
          </Select>
        )}
      </SectionCard>

      {activeStore && (
        <SectionCard
          title={`Dados — ${activeStore.name}`}
          description={
            canManage
              ? "Identificação da loja e canais de atendimento. Use os botões ao lado de cada campo para copiar ou abrir."
              : "Apenas o DONO pode alterar os dados e os membros da loja."
          }
        >
          <div className="flex flex-col gap-6">
            <fieldset className="flex flex-col gap-4">
              <legend className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-subtle">
                Identificação
              </legend>
              <Input
                label="Nome"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                disabled={fieldsDisabled}
              />
              <Input
                label="Razão social"
                value={form.legalName}
                onChange={(e) => updateField("legalName", e.target.value)}
                disabled={fieldsDisabled}
                placeholder="Amore Mio Alimentos LTDA"
              />
              <ContactField
                label="CNPJ"
                value={form.cnpj}
                onChange={(v) => updateField("cnpj", formatCNPJ(v))}
                disabled={fieldsDisabled}
                inputMode="numeric"
                placeholder="00.000.000/0000-00"
                error={cnpjError}
              />
            </fieldset>

            <fieldset className="flex flex-col gap-4 border-t border-hairline pt-5">
              <legend className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-subtle">
                Contato e plataformas
              </legend>
              <ContactField
                label="WhatsApp"
                value={form.whatsapp}
                onChange={(v) =>
                  updateField("whatsapp", formatBrazilianPhone(v))
                }
                disabled={fieldsDisabled}
                inputMode="tel"
                placeholder="(11) 99999-8888"
                copyValue={digits(form.whatsapp)}
                openHref={whatsappHref(form.whatsapp)}
                openTitle="Abrir no WhatsApp"
                openIcon={<MessageCircle size={15} />}
              />
              <ContactField
                label="E-mail"
                value={form.email}
                onChange={(v) => updateField("email", v)}
                disabled={fieldsDisabled}
                inputMode="email"
                placeholder="contato@amoremio.com"
                openHref={mailtoHref(form.email)}
                openTitle="Enviar e-mail"
                openIcon={<Mail size={15} />}
              />
              <ContactField
                label="Instagram"
                value={form.instagram}
                onChange={(v) => updateField("instagram", v)}
                disabled={fieldsDisabled}
                placeholder="amoremio"
                copyValue={instagramHandle(form.instagram)}
                openHref={instagramHref(form.instagram)}
                openTitle="Abrir no Instagram"
                openIcon={<Instagram size={15} />}
              />
              <ContactField
                label="Link iFood"
                value={form.ifoodUrl}
                onChange={(v) => updateField("ifoodUrl", v)}
                disabled={fieldsDisabled}
                inputMode="url"
                placeholder="https://ifood.com.br/delivery/..."
                openHref={externalHref(form.ifoodUrl)}
                openTitle="Abrir no iFood"
                openIcon={<Utensils size={15} />}
              />
              <ContactField
                label="Link 99Food"
                value={form.food99Url}
                onChange={(v) => updateField("food99Url", v)}
                disabled={fieldsDisabled}
                inputMode="url"
                placeholder="https://99food.com/..."
                openHref={externalHref(form.food99Url)}
                openTitle="Abrir no 99Food"
                openIcon={<ShoppingBag size={15} />}
              />
            </fieldset>

            {canManage && (
              <div className="flex items-center justify-end gap-3 border-t border-hairline pt-4">
                {isDirty && (
                  <span className="text-[12px] text-ink-subtle">
                    Alterações não salvas
                  </span>
                )}
                <Button
                  variant="primary"
                  loading={saving}
                  disabled={saving || !isDirty || !form.name.trim() || !!cnpjError}
                  onClick={handleSave}
                >
                  Salvar alterações
                </Button>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      <SectionCard
        title="Nova loja"
        description="Cria uma loja e define você como DONO."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Input
            label="Nome da loja"
            value={newStoreName}
            onChange={(e) => setNewStoreName(e.target.value)}
            placeholder="Ex.: Amore Mio Centro"
            wrapperClassName="flex-1"
          />
          <Button
            variant="primary"
            loading={creating}
            disabled={creating || !newStoreName.trim()}
            onClick={handleCreate}
          >
            Criar loja
          </Button>
        </div>
      </SectionCard>

      {activeStore && (
        <SectionCard title="Membros">
          {membersLoading ? (
            <p className="text-[13px] text-ink-muted">Carregando membros...</p>
          ) : (
            <div className="flex flex-col gap-2">
              {members.map((member) => (
                <div
                  key={member.idStoreMembership}
                  className="flex flex-col gap-2 rounded-md border border-hairline bg-card-alt px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-ink">
                      {member.name}
                    </p>
                    <p className="truncate text-[12px] text-ink-subtle">
                      {member.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {canManage ? (
                      <>
                        <Select
                          value={member.role}
                          onChange={(e) =>
                            handleChangeRole(
                              member.idUsers,
                              e.target.value as StoreRole,
                            )
                          }
                        >
                          {storeRoleOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="!text-err-fg hover:!bg-err-bg"
                          onClick={() => handleRemoveMember(member.idUsers)}
                        >
                          Remover
                        </Button>
                      </>
                    ) : (
                      <span className="text-[13px] text-ink-muted">
                        {storeRoleLabel[member.role]}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {canManage && (
            <div className="mt-4 flex flex-col gap-3 border-t border-hairline pt-4 sm:flex-row sm:items-end">
              <Select
                label="Adicionar usuário"
                value={newMemberUserId}
                onChange={(e) => setNewMemberUserId(e.target.value)}
                wrapperClassName="flex-1"
              >
                <option value="">Selecione um usuário</option>
                {assignableUsers.map((user) => (
                  <option key={user.idUsers} value={user.idUsers}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </Select>
              <Select
                label="Papel"
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value as StoreRole)}
              >
                {storeRoleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              <Button
                variant="primary"
                loading={addingMember}
                disabled={addingMember || !newMemberUserId}
                onClick={handleAddMember}
              >
                Adicionar
              </Button>
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
}
