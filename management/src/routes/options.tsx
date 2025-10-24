import { useCallback, useState } from "react";
import { graphql, useLazyLoadQuery } from "react-relay";

import type { optionsRouteQuery } from "./__generated__/optionsRouteQuery.graphql";
import { OptionsManager } from "./options/OptionsManager";

const optionsRouteQueryDocument = graphql`
  query optionsRouteQuery {
    ...OptionsManagerFragment
  }
`;

export function OptionsRoute() {
  const [refreshKey, setRefreshKey] = useState(0);
  const data = useLazyLoadQuery<optionsRouteQuery>(
    optionsRouteQueryDocument,
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
    <section aria-labelledby="options-heading" className="options-route">
      <header className="options-route__header">
        <h2 id="options-heading">Options</h2>
        <p>
          Search for configuration entries, inspect their metadata, and update JSON values with
          validation before persisting changes. Create or delete options to keep settings aligned
          with your application needs.
        </p>
      </header>
      <OptionsManager queryRef={data} onRefresh={handleRefresh} />
    </section>
  );
}

export default OptionsRoute;
