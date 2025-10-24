import "./dashboard/dashboard.css";

import { graphql, useLazyLoadQuery } from "react-relay";
import { DashboardStatCard } from "./dashboard/DashboardStatCard";
import type { dashboardHealthQuery } from "./__generated__/dashboardHealthQuery.graphql";

type ManagementStatKey = keyof NonNullable<
  dashboardHealthQuery["response"]["managementStats"]
>;

const dashboardQuery = graphql`
  query dashboardHealthQuery {
    health
    managementStats {
      posts
      comments
      mediaItems
      taxonomies
      users
    }
  }
`;

const METRICS: Array<{
  key: ManagementStatKey;
  label: string;
  description: string;
}> = [
  {
    key: "posts",
    label: "Posts",
    description: "Total entries across the editorial workflow.",
  },
  {
    key: "comments",
    label: "Comments",
    description: "Reader responses awaiting moderation or review.",
  },
  {
    key: "mediaItems",
    label: "Media items",
    description: "Uploaded assets that can be reused across content.",
  },
  {
    key: "taxonomies",
    label: "Taxonomies",
    description: "Categories, tags, and other organizational vocabularies.",
  },
  {
    key: "users",
    label: "Users",
    description: "Collaborators with access to the management experience.",
  },
];

export function DashboardRoute() {
  const data = useLazyLoadQuery<dashboardHealthQuery>(
    dashboardQuery,
    {},
    {
      fetchPolicy: "store-or-network",
    },
  );

  const stats = data.managementStats;

  return (
    <section aria-labelledby="dashboard-heading" className="dashboard-route">
      <header className="dashboard-route__header">
        <h2 id="dashboard-heading">Dashboard</h2>
        <p className="dashboard-route__health" role="status">
          API health: {data.health ?? "unknown"}
        </p>
      </header>
      <div className="dashboard-route__intro">
        <p>
          This space will host high-level metrics, recent activity, and shortcuts into editorial
          workflows.
        </p>
        <p>
          The Relay query above ensures that future widgets can reuse this route&apos;s preloadable data
          without rewriting entry points.
        </p>
      </div>

      <section
        aria-labelledby="dashboard-metrics-heading"
        className="dashboard-route__metrics"
      >
        <h3 id="dashboard-metrics-heading">Key metrics</h3>
        {stats ? (
          <div className="dashboard-route__stat-grid">
            {METRICS.map(({ key, label, description }) => (
              <DashboardStatCard
                key={key}
                label={label}
                value={stats?.[key] ?? null}
                description={description}
              />
            ))}
          </div>
        ) : (
          <p className="dashboard-route__empty">
            Statistics are not available yet. Connect the API or start creating content to populate
            these totals.
          </p>
        )}
      </section>
    </section>
  );
}

export default DashboardRoute;
