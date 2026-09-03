import { apiHttp, getApiErrorMessage } from "../shared/http-client";
import type {
  AddStoreMemberPayload,
  CreateStorePayload,
  Store,
  StoreMember,
  UpdateStorePayload,
  UpdateStoreMemberRolePayload,
} from "./schema";

export async function getMyStores(): Promise<Store[]> {
  try {
    const response = await apiHttp.get<Store[]>("/stores");
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível listar as lojas."),
    );
  }
}

export async function getStoreById(idStore: string): Promise<Store> {
  try {
    const response = await apiHttp.get<Store>(`/stores/${idStore}`);
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível carregar a loja."),
    );
  }
}

export async function createStore(payload: CreateStorePayload): Promise<Store> {
  try {
    const response = await apiHttp.post<Store>("/stores", payload);
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível criar a loja."),
    );
  }
}

export async function updateStore(payload: UpdateStorePayload): Promise<Store> {
  try {
    const { idStore, ...body } = payload;
    const response = await apiHttp.patch<Store>(`/stores/${idStore}`, body);
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível atualizar a loja."),
    );
  }
}

export async function getStoreMembers(idStore: string): Promise<StoreMember[]> {
  try {
    const response = await apiHttp.get<StoreMember[]>(
      `/stores/${idStore}/members`,
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível listar os membros."),
    );
  }
}

export async function addStoreMember(
  payload: AddStoreMemberPayload,
): Promise<StoreMember[]> {
  try {
    const response = await apiHttp.post<StoreMember[]>(
      `/stores/${payload.idStore}/members`,
      { idUsers: payload.idUsers, role: payload.role },
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível adicionar o membro."),
    );
  }
}

export async function updateStoreMemberRole(
  payload: UpdateStoreMemberRolePayload,
): Promise<StoreMember[]> {
  try {
    const response = await apiHttp.patch<StoreMember[]>(
      `/stores/${payload.idStore}/members/${payload.idUsers}`,
      { role: payload.role },
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(
        error,
        "Não foi possível atualizar o papel do membro.",
      ),
    );
  }
}

export async function removeStoreMember(
  idStore: string,
  idUsers: string,
): Promise<StoreMember[]> {
  try {
    const response = await apiHttp.delete<StoreMember[]>(
      `/stores/${idStore}/members/${idUsers}`,
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível remover o membro."),
    );
  }
}
