import { z } from "zod";

export const StoreRoleSchema = z.enum(["DONO", "GERENTE", "FUNCIONARIO"]);

export const StoreSchema = z.object({
  idStore: z.string(),
  name: z.string(),
  legalName: z.string().nullable().optional(),
  cnpj: z.string().nullable().optional(),
  whatsapp: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  instagram: z.string().nullable().optional(),
  ifoodUrl: z.string().nullable().optional(),
  food99Url: z.string().nullable().optional(),
  status: z.boolean(),
  role: StoreRoleSchema.nullable().optional(),
  createdByUserId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const StoreMemberSchema = z.object({
  idStoreMembership: z.string(),
  idStore: z.string(),
  idUsers: z.string(),
  name: z.string(),
  email: z.string(),
  username: z.string().nullable().optional(),
  role: StoreRoleSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CreateStorePayloadSchema = z.object({
  name: z.string().min(1),
  legalName: z.string().optional(),
  cnpj: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().optional(),
  instagram: z.string().optional(),
  ifoodUrl: z.string().optional(),
  food99Url: z.string().optional(),
});

export const UpdateStorePayloadSchema = z.object({
  idStore: z.string().min(1),
  name: z.string().min(1).optional(),
  legalName: z.string().nullable().optional(),
  cnpj: z.string().nullable().optional(),
  whatsapp: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  instagram: z.string().nullable().optional(),
  ifoodUrl: z.string().nullable().optional(),
  food99Url: z.string().nullable().optional(),
  status: z.boolean().optional(),
});

export const AddStoreMemberPayloadSchema = z.object({
  idStore: z.string().min(1),
  idUsers: z.string().min(1),
  role: StoreRoleSchema,
});

export const UpdateStoreMemberRolePayloadSchema = z.object({
  idStore: z.string().min(1),
  idUsers: z.string().min(1),
  role: StoreRoleSchema,
});

export type StoreRole = z.infer<typeof StoreRoleSchema>;
export type Store = z.infer<typeof StoreSchema>;
export type StoreMember = z.infer<typeof StoreMemberSchema>;
export type CreateStorePayload = z.infer<typeof CreateStorePayloadSchema>;
export type UpdateStorePayload = z.infer<typeof UpdateStorePayloadSchema>;
export type AddStoreMemberPayload = z.infer<typeof AddStoreMemberPayloadSchema>;
export type UpdateStoreMemberRolePayload = z.infer<
  typeof UpdateStoreMemberRolePayloadSchema
>;
