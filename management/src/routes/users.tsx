import "./users/users.css";

import { graphql, useLazyLoadQuery } from "react-relay";

import type { usersRouteQuery } from "./__generated__/usersRouteQuery.graphql";
import { UsersManager } from "./users/UsersManager";

export const USERS_PAGE_SIZE = 20;

const usersRouteQueryDocument = graphql`
  query usersRouteQuery($first: Int = 20) {
    ...UsersManagerFragment @arguments(first: $first)
  }
`;

export function UsersRoute() {
  const data = useLazyLoadQuery<usersRouteQuery>(
    usersRouteQueryDocument,
    { first: USERS_PAGE_SIZE },
    {
      fetchPolicy: "store-or-network",
    },
  );

  return (
    <section aria-labelledby="users-heading" className="users-route">
      <header className="users-route__header">
        <h2 id="users-heading">Users</h2>
        <p>
          Audit and manage account records, update contact channels, and curate the profile
          information that appears across public-facing touchpoints.
        </p>
      </header>
      <UsersManager queryRef={data} pageSize={USERS_PAGE_SIZE} />
    </section>
  );
}

export default UsersRoute;
