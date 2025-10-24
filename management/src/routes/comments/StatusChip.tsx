import type { CommentStatus } from "./__generated__/CommentsTableFragment.graphql";

type StatusChipProps = {
  status: CommentStatus | null | undefined;
};

const STATUS_LABELS: Record<CommentStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  spam: "Spam",
  trash: "Trash",
};

export function StatusChip({ status }: StatusChipProps) {
  const isKnownStatus = status ? status in STATUS_LABELS : false;
  const modifier = isKnownStatus && status ? status : "unknown";
  const label = isKnownStatus && status ? STATUS_LABELS[status] : "Unknown";

  return <span className={`status-chip status-chip--${modifier}`}>{label}</span>;
}
