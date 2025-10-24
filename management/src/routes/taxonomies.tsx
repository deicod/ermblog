import { useCallback, useState } from "react";
import { graphql, useLazyLoadQuery } from "react-relay";

import type { taxonomiesRouteQuery } from "./__generated__/taxonomiesRouteQuery.graphql";
import { TaxonomiesManager } from "./taxonomies/TaxonomiesManager";

const taxonomiesRouteQueryDocument = graphql`
  query taxonomiesRouteQuery {
    ...TaxonomiesManagerFragment
  }
`;

export function TaxonomiesRoute() {
  const [refreshKey, setRefreshKey] = useState(0);
  const data = useLazyLoadQuery<taxonomiesRouteQuery>(
    taxonomiesRouteQueryDocument,
    {},
    {
      fetchPolicy: "store-or-network",
      fetchKey: refreshKey,
    },
  );

  const handleRefresh = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  return (
    <section aria-labelledby="taxonomies-heading" className="taxonomies-route">
      <header className="taxonomies-route__header">
        <h2 id="taxonomies-heading">Taxonomies</h2>
        <p>
          Manage hierarchical categories and flexible tags to organize content. Create, edit, or
          remove entries while keeping parent-child relationships intact.
        </p>
      </header>
      <TaxonomiesManager queryRef={data} onRefresh={handleRefresh} />
    </section>
  );
}

export default TaxonomiesRoute;
