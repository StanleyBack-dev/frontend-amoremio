import {
  addStoreMember as addStoreMemberRequest,
  createStore as createStoreRequest,
  getMyStores as getMyStoresRequest,
  getStoreById as getStoreByIdRequest,
  getStoreMembers as getStoreMembersRequest,
  removeStoreMember as removeStoreMemberRequest,
  updateStore as updateStoreRequest,
  updateStoreMemberRole as updateStoreMemberRoleRequest,
} from "@/api/stores/methods";
import {
  AddStoreMemberPayloadSchema,
  CreateStorePayloadSchema,
  StoreMemberSchema,
  StoreSchema,
  UpdateStorePayloadSchema,
  UpdateStoreMemberRolePayloadSchema,
  type AddStoreMemberPayload,
  type CreateStorePayload,
  type Store,
  type StoreMember,
  type UpdateStorePayload,
  type UpdateStoreMemberRolePayload,
} from "@/api/stores/schema";

const INVALID_DATA = "Resposta inválida do servidor de lojas.";

export async function fetchMyStores(): Promise<Store[]> {
  const parsed = StoreSchema.array().safeParse(await getMyStoresRequest());
  if (!parsed.success) {
    throw new Error(INVALID_DATA);
  }
  return parsed.data;
}

export async function fetchStoreById(idStore: string): Promise<Store> {
  const parsed = StoreSchema.safeParse(await getStoreByIdRequest(idStore));
  if (!parsed.success) {
    throw new Error(INVALID_DATA);
  }
  return parsed.data;
}

export async function createStore(payload: CreateStorePayload): Promise<Store> {
  const parsedPayload = CreateStorePayloadSchema.parse(payload);
  const parsed = StoreSchema.safeParse(await createStoreRequest(parsedPayload));
  if (!parsed.success) {
    throw new Error(INVALID_DATA);
  }
  return parsed.data;
}

export async function updateStore(payload: UpdateStorePayload): Promise<Store> {
  const parsedPayload = UpdateStorePayloadSchema.parse(payload);
  const parsed = StoreSchema.safeParse(await updateStoreRequest(parsedPayload));
  if (!parsed.success) {
    throw new Error(INVALID_DATA);
  }
  return parsed.data;
}

export async function fetchStoreMembers(
  idStore: string,
): Promise<StoreMember[]> {
  const parsed = StoreMemberSchema.array().safeParse(
    await getStoreMembersRequest(idStore),
  );
  if (!parsed.success) {
    throw new Error(INVALID_DATA);
  }
  return parsed.data;
}

export async function addStoreMember(
  payload: AddStoreMemberPayload,
): Promise<StoreMember[]> {
  const parsedPayload = AddStoreMemberPayloadSchema.parse(payload);
  const parsed = StoreMemberSchema.array().safeParse(
    await addStoreMemberRequest(parsedPayload),
  );
  if (!parsed.success) {
    throw new Error(INVALID_DATA);
  }
  return parsed.data;
}

export async function updateStoreMemberRole(
  payload: UpdateStoreMemberRolePayload,
): Promise<StoreMember[]> {
  const parsedPayload = UpdateStoreMemberRolePayloadSchema.parse(payload);
  const parsed = StoreMemberSchema.array().safeParse(
    await updateStoreMemberRoleRequest(parsedPayload),
  );
  if (!parsed.success) {
    throw new Error(INVALID_DATA);
  }
  return parsed.data;
}

export async function removeStoreMember(
  idStore: string,
  idUsers: string,
): Promise<StoreMember[]> {
  const parsed = StoreMemberSchema.array().safeParse(
    await removeStoreMemberRequest(idStore, idUsers),
  );
  if (!parsed.success) {
    throw new Error(INVALID_DATA);
  }
  return parsed.data;
}
