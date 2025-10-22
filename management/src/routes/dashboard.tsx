import { graphql, useLazyLoadQuery } from "react-relay";
import type { dashboardHealthQuery } from "./__generated__/dashboardHealthQuery.graphql";

const dashboardQuery = graphql`
  query dashboardHealthQuery {
    health
  }
`;

export function DashboardRoute() {
  const data = useLazyLoadQuery<dashboardHealthQuery>(
    dashboardQuery,
    {},
    {
      fetchPolicy: "store-or-network",
    },
  );

  return (
    <section aria-labelledby="dashboard-heading">
      <header>
        <h2 id="dashboard-heading">Dashboard</h2>
        <p role="status">API health: {data.health ?? "unknown"}</p>
      </header>
      <div>
        <p>
          This space will host high-level metrics, recent activity, and shortcuts into
          editorial workflows.
        </p>
        <p>
          The Relay query above ensures that future widgets can reuse this route&apos;s
          preloadable data without rewriting entry points.
        </p>
      </div>
    </section>
  );
}

export default DashboardRoute;
