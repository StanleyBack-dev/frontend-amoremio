import { z } from "zod";

export const UnmappedChannelProductSchema = z.object({
  channel: z.string(),
  externalProductId: z.string(),
  externalProductName: z.string(),
  pendingEventCount: z.number(),
});

export type UnmappedChannelProduct = z.infer<
  typeof UnmappedChannelProductSchema
>;

export const MapChannelProductResultSchema = z.object({
  promotedOrders: z.number(),
  failedOrders: z.number(),
});

export type MapChannelProductResult = z.infer<
  typeof MapChannelProductResultSchema
>;

export interface MapChannelProductPayload {
  idStore: string;
  channel: string;
  externalProductId: string;
  externalProductName: string;
  idProduct: string;
}
