import {
  confirmAttachmentUpload,
  getAttachments,
  removeAttachment as removeAttachmentRequest,
  reorderAttachments as reorderAttachmentsRequest,
  requestAttachmentUpload,
  uploadToStorage,
} from "@/api/attachments/methods";
import {
  AttachmentSchema,
  UploadTicketSchema,
  type Attachment,
  type AttachmentOwnerRef,
} from "@/api/attachments/schema";

const INVALID = "Resposta inválida do servidor de imagens.";

// Mirrors the backend rules (image-upload.policy). This is only a fast,
// friendly pre-check: the backend re-validates the actual bytes.
export const IMAGE_RULES = {
  maxBytes: 5 * 1024 * 1024,
  maxPerProduct: 4,
  acceptedTypes: ["image/jpeg", "image/png", "image/webp"],
  // Value for <input accept>.
  accept: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp",
  // Photos are downscaled in the browser to what the server keeps anyway,
  // so a 4–5 MB phone photo uploads as a few hundred KB.
  clientMaxDimension: 1600,
  clientQuality: 0.88,
  // Originals above this are refused before decoding, to keep the browser
  // from choking on huge files.
  maxOriginalBytes: 25 * 1024 * 1024,
} as const;

// ---------------------------------------------------------------------------
// Draft model: the form edits a local list and only syncs it on save.
// ---------------------------------------------------------------------------

export type DraftImage =
  | { kind: "saved"; key: string; attachment: Attachment }
  | { kind: "new"; key: string; file: File; previewUrl: string };

export function toDraft(images: Attachment[]): DraftImage[] {
  return images.map((attachment) => ({
    kind: "saved",
    key: attachment.idAttachment,
    attachment,
  }));
}

export function draftPreviewUrl(image: DraftImage): string {
  return image.kind === "saved"
    ? image.attachment.thumbnailUrl
    : image.previewUrl;
}

// Object URLs keep the file in memory until revoked.
export function releaseDraft(images: DraftImage[]): void {
  for (const image of images) {
    if (image.kind === "new") URL.revokeObjectURL(image.previewUrl);
  }
}

export function hasDraftChanges(
  saved: Attachment[],
  draft: DraftImage[],
): boolean {
  const savedIds = saved.map((image) => image.idAttachment).join();
  const draftIds = draft
    .map((image) => (image.kind === "saved" ? image.key : "new"))
    .join();
  return savedIds !== draftIds;
}

function isAcceptedType(file: File): boolean {
  return (IMAGE_RULES.acceptedTypes as readonly string[]).includes(file.type);
}

function renameExtension(name: string, extension: string): string {
  const base = name.replace(/\.[^.]+$/, "") || "foto";
  return `${base}.${extension}`;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

// Downscales and re-encodes a photo in the browser. Returns the original
// file when it is already small or when the browser can't process it — the
// server still validates and normalizes whatever arrives.
async function shrinkImage(file: File): Promise<File> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file;
  }

  try {
    const { clientMaxDimension, clientQuality } = IMAGE_RULES;
    const scale = Math.min(
      1,
      clientMaxDimension / Math.max(bitmap.width, bitmap.height),
    );
    if (scale === 1 && file.size <= 500 * 1024) return file;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas
      .getContext("2d")
      ?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    // Safari can't encode WebP and silently returns PNG; fall back to JPEG.
    let blob = await canvasToBlob(canvas, "image/webp", clientQuality);
    let extension = "webp";
    if (!blob || blob.type !== "image/webp") {
      blob = await canvasToBlob(canvas, "image/jpeg", clientQuality);
      extension = "jpg";
    }
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], renameExtension(file.name, extension), {
      type: blob.type,
      lastModified: file.lastModified,
    });
  } finally {
    bitmap.close();
  }
}

// Validates and prepares picked files. Returns the draft entries to add and
// one message per rejected file.
export async function prepareDraftImages(
  files: File[],
): Promise<{ added: DraftImage[]; errors: string[] }> {
  const added: DraftImage[] = [];
  const errors: string[] = [];

  for (const original of files) {
    if (!isAcceptedType(original)) {
      errors.push(
        `"${original.name}": formato não suportado. Envie JPEG, PNG ou WebP.`,
      );
      continue;
    }
    if (original.size === 0) {
      errors.push(`"${original.name}": o arquivo está vazio.`);
      continue;
    }
    if (original.size > IMAGE_RULES.maxOriginalBytes) {
      errors.push(`"${original.name}": arquivo grande demais.`);
      continue;
    }

    const file = await shrinkImage(original);
    if (file.size > IMAGE_RULES.maxBytes) {
      errors.push(`"${original.name}": a imagem deve ter no máximo 5 MB.`);
      continue;
    }

    added.push({
      kind: "new",
      key: `new-${crypto.randomUUID()}`,
      file,
      previewUrl: URL.createObjectURL(file),
    });
  }

  return { added, errors };
}

// ---------------------------------------------------------------------------
// Server operations
// ---------------------------------------------------------------------------

function parseList(value: unknown): Attachment[] {
  const parsed = AttachmentSchema.array().safeParse(value);
  if (!parsed.success) throw new Error(INVALID);
  return parsed.data;
}

export async function fetchAttachments(
  owner: AttachmentOwnerRef,
): Promise<Attachment[]> {
  return parseList(await getAttachments(owner));
}

// Full upload flow: ask the backend for a signed form, send the file
// straight to storage, then ask the backend to validate/process it.
async function uploadImage(
  owner: AttachmentOwnerRef,
  file: File,
): Promise<Attachment> {
  const ticket = UploadTicketSchema.safeParse(
    await requestAttachmentUpload({
      ...owner,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    }),
  );
  if (!ticket.success) throw new Error(INVALID);

  try {
    await uploadToStorage(ticket.data, file);
  } catch (error) {
    // Free the reserved slot right away instead of letting it count
    // against the photo limit until it expires. Best effort only.
    await removeAttachmentRequest(
      owner.idStore,
      ticket.data.idAttachment,
    ).catch(() => undefined);
    throw error;
  }

  const confirmed = AttachmentSchema.safeParse(
    await confirmAttachmentUpload(owner.idStore, ticket.data.idAttachment),
  );
  if (!confirmed.success) throw new Error(INVALID);
  return confirmed.data;
}

export interface SyncImagesResult {
  images: Attachment[];
  errors: string[];
}

// Applies the draft to the server: removals first (so they free slots),
// then uploads, then one reorder if the final order differs from what the
// server ended up with. Failures are collected per image instead of
// aborting, so one bad photo doesn't lose the others.
export async function syncDraftImages(
  owner: AttachmentOwnerRef,
  saved: Attachment[],
  draft: DraftImage[],
): Promise<SyncImagesResult> {
  const errors: string[] = [];
  const keptIds = new Set(
    draft.flatMap((image) => (image.kind === "saved" ? [image.key] : [])),
  );

  const removed = saved.filter((image) => !keptIds.has(image.idAttachment));
  await Promise.all(
    removed.map((image) =>
      removeAttachmentRequest(owner.idStore, image.idAttachment).catch(
        (error: unknown) => {
          keptIds.add(image.idAttachment);
          errors.push(
            error instanceof Error ? error.message : "Falha ao remover foto.",
          );
        },
      ),
    ),
  );

  // Uploads run in parallel; the server assigns positions on confirm, and
  // the final order is fixed by the reorder below either way.
  const uploadedByKey = new Map<string, Attachment>();
  await Promise.all(
    draft.map(async (image) => {
      if (image.kind !== "new") return;
      try {
        uploadedByKey.set(image.key, await uploadImage(owner, image.file));
      } catch (error) {
        errors.push(
          `"${image.file.name}": ${
            error instanceof Error ? error.message : "falha no envio."
          }`,
        );
      }
    }),
  );

  const desiredIds = draft.flatMap((image) => {
    if (image.kind === "saved") {
      return keptIds.has(image.key) ? [image.key] : [];
    }
    const uploaded = uploadedByKey.get(image.key);
    return uploaded ? [uploaded.idAttachment] : [];
  });

  let current = await fetchAttachments(owner);
  const currentIds = current.map((image) => image.idAttachment);
  const sameMembers =
    currentIds.length === desiredIds.length &&
    desiredIds.every((id) => currentIds.includes(id));
  // Parallel confirms may be handed the same position by the server, so
  // after any upload the order is written explicitly — this also
  // normalizes positions to 0..n-1.
  const needsOrder =
    uploadedByKey.size > 0 || currentIds.join() !== desiredIds.join();
  if (sameMembers && needsOrder) {
    try {
      current = parseList(await reorderAttachmentsRequest(owner, desiredIds));
    } catch (error) {
      errors.push(
        error instanceof Error ? error.message : "Falha ao ordenar as fotos.",
      );
    }
  }

  return { images: current, errors };
}
