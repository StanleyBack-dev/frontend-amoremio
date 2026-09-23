import { useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Loader2,
  Star,
  Trash2,
} from "lucide-react";
import { fieldLabelClass } from "@atoms/field";
import { useToast } from "@/shared/toast/useToast";
import {
  IMAGE_RULES,
  draftPreviewUrl,
  prepareDraftImages,
  releaseDraft,
  type DraftImage,
} from "@/features/attachments";

interface ImageAttachmentsFieldProps {
  label?: string;
  images: DraftImage[];
  onChange: (images: DraftImage[]) => void;
  max?: number;
  disabled?: boolean;
  /** Shown while the saved images are still being fetched. */
  loading?: boolean;
}

const tileClass =
  "relative aspect-square overflow-hidden rounded-md border border-hairline-strong bg-field";

const iconButtonClass =
  "flex h-7 w-7 items-center justify-center rounded-md bg-black/55 text-white " +
  "transition-colors hover:bg-black/75 focus-visible:outline-none " +
  "focus-visible:ring-2 focus-visible:ring-gold-500/60 disabled:opacity-40";

// Photo picker for a form. It only edits a local draft (add, remove,
// reorder, cover); nothing reaches the server until the form is saved —
// see syncDraftImages. The first image is the cover.
export default function ImageAttachmentsField({
  label = "Fotos",
  images,
  onChange,
  max = IMAGE_RULES.maxPerProduct,
  disabled = false,
  loading = false,
}: ImageAttachmentsFieldProps) {
  const { showError } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preparing, setPreparing] = useState(false);

  const remaining = max - images.length;
  const locked = disabled || loading || preparing;

  async function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const files = Array.from(fileList);
    if (inputRef.current) inputRef.current.value = "";

    const errors: string[] = [];
    if (files.length > remaining) {
      errors.push(`Limite de ${max} fotos por produto.`);
      files.splice(Math.max(remaining, 0));
    }

    setPreparing(true);
    try {
      const prepared = await prepareDraftImages(files);
      errors.push(...prepared.errors);
      if (prepared.added.length > 0) onChange([...images, ...prepared.added]);
    } finally {
      setPreparing(false);
    }

    if (errors.length > 0) {
      showError("Algumas imagens não foram adicionadas", errors.join(" "));
    }
  }

  function move(index: number, target: number) {
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onChange(next);
  }

  function remove(index: number) {
    releaseDraft([images[index]]);
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className={fieldLabelClass}>{label}</span>
        <span className="text-[11px] text-ink-subtle tabular-nums">
          {images.length}/{max}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {images.map((image, index) => (
          <div key={image.key} className={tileClass}>
            {image.kind === "saved" ? (
              <a
                href={image.attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                title="Abrir em tamanho original"
              >
                <img
                  src={draftPreviewUrl(image)}
                  alt={image.attachment.originalName}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </a>
            ) : (
              <img
                src={draftPreviewUrl(image)}
                alt={image.file.name}
                className="h-full w-full object-cover"
              />
            )}

            <div className="absolute left-1.5 top-1.5 flex gap-1">
              {index === 0 && (
                <span className="rounded bg-gold-500 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  Capa
                </span>
              )}
              {image.kind === "new" && (
                <span className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  Nova
                </span>
              )}
            </div>

            {!disabled && (
              <div className="absolute inset-x-1.5 bottom-1.5 flex items-center justify-between gap-1">
                <div className="flex gap-1">
                  <button
                    type="button"
                    className={iconButtonClass}
                    title="Mover para a esquerda"
                    aria-label="Mover para a esquerda"
                    disabled={locked || index === 0}
                    onClick={() => move(index, index - 1)}
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <button
                    type="button"
                    className={iconButtonClass}
                    title="Mover para a direita"
                    aria-label="Mover para a direita"
                    disabled={locked || index === images.length - 1}
                    onClick={() => move(index, index + 1)}
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
                <div className="flex gap-1">
                  {index !== 0 && (
                    <button
                      type="button"
                      className={iconButtonClass}
                      title="Definir como capa"
                      aria-label="Definir como capa"
                      disabled={locked}
                      onClick={() => move(index, 0)}
                    >
                      <Star size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    className={iconButtonClass}
                    title="Remover foto"
                    aria-label="Remover foto"
                    disabled={locked}
                    onClick={() => remove(index)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {(loading || preparing) && (
          <div
            className={`${tileClass} flex flex-col items-center justify-center gap-1 text-[11px] font-medium text-ink-muted`}
          >
            <Loader2 size={20} className="animate-spin" />
            {loading ? "Carregando…" : "Preparando…"}
          </div>
        )}

        {!locked && remaining > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={`${tileClass} flex flex-col items-center justify-center gap-1 border-dashed text-[11px] font-medium text-ink-muted transition-colors hover:border-gold-400 hover:text-ink`}
          >
            <ImagePlus size={20} />
            Adicionar
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_RULES.accept}
        multiple
        hidden
        onChange={(event) => void handleFiles(event.target.files)}
      />

      {!disabled && (
        <p className="mt-1.5 text-[11px] text-ink-subtle">
          JPEG, PNG ou WebP, até 5 MB cada. A primeira foto é a capa. As
          alterações são enviadas ao salvar.
        </p>
      )}
    </div>
  );
}
