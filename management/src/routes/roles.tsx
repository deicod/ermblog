import "./roles/roles.css";

import { graphql, useLazyLoadQuery } from "react-relay";

import type { rolesRouteQuery } from "./__generated__/rolesRouteQuery.graphql";
import { RolesManager } from "./roles/RolesManager";

export const ROLES_PAGE_SIZE = 20;

const rolesRouteQueryDocument = graphql`
  query rolesRouteQuery($first: Int = 20) {
    ...RolesManagerFragment @arguments(first: $first)
  }
`;

export function RolesRoute() {
  const data = useLazyLoadQuery<rolesRouteQuery>(
    rolesRouteQueryDocument,
    { first: ROLES_PAGE_SIZE },
    {
      fetchPolicy: "store-or-network",
    },
  );

  return (
    <section aria-labelledby="roles-heading" className="roles-route">
      <header className="roles-route__header">
        <h2 id="roles-heading">Roles</h2>
        <p>
          Coordinate capability bundles, delegate responsibilities, and keep permission models in
          sync with your organization&apos;s needs.
        </p>
      </header>
      <RolesManager queryRef={data} pageSize={ROLES_PAGE_SIZE} />
    </section>
  );
}

export default RolesRoute;

