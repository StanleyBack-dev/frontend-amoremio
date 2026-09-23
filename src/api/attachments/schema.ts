import { z } from "zod";

export const AttachmentOwnerTypeSchema = z.enum(["PRODUCT"]);

export const AttachmentSchema = z.object({
  idAttachment: z.string(),
  ownerType: AttachmentOwnerTypeSchema,
  ownerId: z.string(),
  position: z.number(),
  mimeType: z.string(),
  sizeBytes: z.number(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  originalName: z.string(),
  // Signed, time-limited URLs (valid for at least 1h after being issued).
  url: z.string(),
  thumbnailUrl: z.string(),
  createdAt: z.string(),
});

export const UploadTicketSchema = z.object({
  idAttachment: z.string(),
  uploadUrl: z.string().url(),
  fields: z.array(z.object({ name: z.string(), value: z.string() })),
  expiresAt: z.string(),
  maxBytes: z.number(),
});

export type AttachmentOwnerType = z.infer<typeof AttachmentOwnerTypeSchema>;
export type Attachment = z.infer<typeof AttachmentSchema>;
export type UploadTicket = z.infer<typeof UploadTicketSchema>;

export interface AttachmentOwnerRef {
  idStore: string;
  ownerType: AttachmentOwnerType;
  ownerId: string;
}

export interface RequestUploadPayload extends AttachmentOwnerRef {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}
