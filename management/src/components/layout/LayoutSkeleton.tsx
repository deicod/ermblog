import { LAYOUT_SKELETON_ARIA_LABEL } from "./constants";

export function AppShellSkeleton() {
  return (
    <div
      className="shell-skeleton"
      aria-busy="true"
      aria-live="polite"
      role="status"
      aria-label={LAYOUT_SKELETON_ARIA_LABEL}
    >
      <div className="shell-skeleton__sidebar" />
      <div>
        <div className="shell-skeleton__header" />
        <div className="shell-skeleton__breadcrumb" />
        <div className="shell-skeleton__content" />
      </div>
    </div>
  );
}
