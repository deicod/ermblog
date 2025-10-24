const STATUS_LABELS = {
  draft: "Draft",
  pending: "Pending",
  private: "Private",
  published: "Published",
  archived: "Archived",
} as const;

type KnownStatus = keyof typeof STATUS_LABELS;

type StatusBadgeProps = {
  status: string | null | undefined;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = (typeof status === "string" ? status.toLowerCase() : undefined) as
    | KnownStatus
    | undefined;
  const label = normalized ? STATUS_LABELS[normalized] : "Unknown";
  const variant = normalized ?? "unknown";

  return (
    <span className={`status-badge status-badge--${variant}`} data-status={variant}>
      {label}
    </span>
  );
}
