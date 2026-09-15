import {
  getUnmappedChannelProducts as getUnmappedChannelProductsRequest,
  mapChannelProduct as mapChannelProductRequest,
} from "@/api/channel-orders/methods";
import {
  MapChannelProductResultSchema,
  UnmappedChannelProductSchema,
  type MapChannelProductPayload,
  type MapChannelProductResult,
  type UnmappedChannelProduct,
} from "@/api/channel-orders/schema";

const INVALID = "Resposta inválida do servidor de pedidos de canais.";

export async function fetchUnmappedChannelProducts(
  idStore: string,
): Promise<UnmappedChannelProduct[]> {
  const parsed = UnmappedChannelProductSchema.array().safeParse(
    await getUnmappedChannelProductsRequest(idStore),
  );
  if (!parsed.success) return [];
  return parsed.data;
}

export async function mapChannelProduct(
  payload: MapChannelProductPayload,
): Promise<MapChannelProductResult> {
  const parsed = MapChannelProductResultSchema.safeParse(
    await mapChannelProductRequest(payload),
  );
  if (!parsed.success) throw new Error(INVALID);
  return parsed.data;
}

export type { UnmappedChannelProduct } from "@/api/channel-orders/schema";
