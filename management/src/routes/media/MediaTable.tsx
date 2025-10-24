import type { MediaLibraryFragment$data } from "./__generated__/MediaLibraryFragment.graphql";

type Edge = NonNullable<NonNullable<MediaLibraryFragment$data["medias"]>["edges"]>[number];

type MediaTableProps = {
  edges: ReadonlyArray<Edge | null | undefined>;
  onEdit: (mediaId: string) => void;
  emptyMessage: string | null;
};

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

const sizeFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

function formatTimestamp(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }
  return dateFormatter.format(parsed);
}

function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null || Number.isNaN(bytes) || bytes < 0) {
    return "—";
  }
  if (bytes === 0) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const formatted = value < 10 ? sizeFormatter.format(Number(value.toFixed(2))) : sizeFormatter.format(Math.round(value));
  return `${formatted} ${units[unitIndex]}`;
}

function formatUploader(uploaderId: string | null | undefined): string {
  if (uploaderId && uploaderId.trim()) {
    return uploaderId;
  }
  return "Unknown uploader";
}

export function MediaTable({ edges, onEdit, emptyMessage }: MediaTableProps) {
  const hasEntries = edges.some((edge) => edge?.node);

  return (
    <table className="media-library__table" role="table">
      <thead>
        <tr>
          <th scope="col">Filename</th>
          <th scope="col">Type</th>
          <th scope="col">Size</th>
          <th scope="col">Uploader</th>
          <th scope="col">Created</th>
          <th scope="col">Updated</th>
          <th scope="col">Actions</th>
        </tr>
      </thead>
      <tbody>
        {!hasEntries ? (
          <tr>
            <td colSpan={7} className="media-library__empty">
              {emptyMessage ?? "Media entries could not be loaded."}
            </td>
          </tr>
        ) : (
          edges.map((edge, index) => {
            const node = edge?.node;
            if (!node) {
              return (
                <tr key={`placeholder-${index}`}>
                  <td colSpan={7} className="media-library__empty">
                    Unable to load this media entry.
                  </td>
                </tr>
              );
            }
            return (
              <tr key={node.id}>
                <th scope="row">{node.fileName}</th>
                <td>{node.mimeType}</td>
                <td>{formatFileSize(node.fileSizeBytes ?? null)}</td>
                <td>{formatUploader(node.uploadedByID)}</td>
                <td>{formatTimestamp(node.createdAt)}</td>
                <td>{formatTimestamp(node.updatedAt)}</td>
                <td>
                  <button type="button" onClick={() => onEdit(node.id)}>
                    Edit metadata
                  </button>
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}
