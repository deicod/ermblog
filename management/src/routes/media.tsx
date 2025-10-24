import "./media/media.css";

import { graphql, useLazyLoadQuery } from "react-relay";

import type { mediaRouteQuery } from "./__generated__/mediaRouteQuery.graphql";
import { MediaLibrary } from "./media/MediaLibrary";
import { resolveStorageConfig } from "../config/storageConfig";

export const MEDIA_PAGE_SIZE = 20;

const mediaRouteQueryDocument = graphql`
  query mediaRouteQuery($first: Int = 20) {
    ...MediaLibraryFragment @arguments(first: $first)
  }
`;

export function MediaRoute() {
  const data = useLazyLoadQuery<mediaRouteQuery>(
    mediaRouteQueryDocument,
    { first: MEDIA_PAGE_SIZE },
    {
      fetchPolicy: "store-or-network",
    },
  );
  const { uploadEndpoint } = resolveStorageConfig();

  return (
    <section aria-labelledby="media-heading" className="media-route">
      <header className="media-route__header">
        <h2 id="media-heading">Media library</h2>
        <p>
          Browse uploaded assets, edit their metadata, and add new files to the library. Use the
          upload workflow to push files to storage before creating the media record.
        </p>
      </header>
      <MediaLibrary queryRef={data} pageSize={MEDIA_PAGE_SIZE} uploadEndpoint={uploadEndpoint} />
    </section>
  );
}

export default MediaRoute;
