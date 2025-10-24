import { useId } from "react";
import type { ReactNode } from "react";

import "./DashboardStatCard.css";

type DashboardStatCardProps = {
  label: string;
  value: number | null | undefined;
  description?: string;
  isLoading?: boolean;
};

function buildValueDisplay(value: DashboardStatCardProps["value"], isLoading?: boolean): ReactNode {
  if (isLoading) {
    return <span className="dashboard-stat-card__placeholder">Loading…</span>;
  }

  if (value === null || value === undefined) {
    return <span className="dashboard-stat-card__placeholder">Not available</span>;
  }

  return value.toLocaleString();
}

export function DashboardStatCard({ label, value, description, isLoading }: DashboardStatCardProps) {
  const titleId = useId();
  const displayValue = buildValueDisplay(value, isLoading);

  return (
    <article aria-labelledby={titleId} aria-busy={isLoading} className="dashboard-stat-card">
      <h3 id={titleId} className="dashboard-stat-card__title">
        {label}
      </h3>
      <p className="dashboard-stat-card__value" aria-live={isLoading ? "polite" : "off"}>
        {displayValue}
      </p>
      {description ? <p className="dashboard-stat-card__description">{description}</p> : null}
    </article>
  );
}

export default DashboardStatCard;
