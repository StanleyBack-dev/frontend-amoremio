import { ImageIcon } from "lucide-react";

interface ProductNameCellProps {
  name: string;
  /** Signed cover thumbnail URL; a placeholder icon is shown when absent. */
  thumbnailUrl?: string | null;
}

// Product name with its cover photo, for table cells. Kept in the name
// column (not a column of its own) so it also shows in the mobile card
// title — see atoms/Table.
export default function ProductNameCell({
  name,
  thumbnailUrl,
}: ProductNameCellProps) {
  return (
    <span className="flex items-center gap-2.5">
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt=""
          loading="lazy"
          className="h-9 w-9 shrink-0 rounded-md border border-hairline object-cover"
        />
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-dashed border-hairline-strong text-ink-subtle">
          <ImageIcon size={15} />
        </span>
      )}
      <span>{name}</span>
    </span>
  );
}
