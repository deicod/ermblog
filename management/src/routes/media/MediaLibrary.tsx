import { useCallback, useMemo, useState } from "react";
import { graphql, usePaginationFragment } from "react-relay";

import type { MediaLibraryFragment$key } from "./__generated__/MediaLibraryFragment.graphql";
import type { MediaLibraryFragment$data } from "./__generated__/MediaLibraryFragment.graphql";
import { MediaEditDialog } from "./MediaEditDialog";
import { MediaTable } from "./MediaTable";
import { MediaUploadDialog } from "./MediaUploadDialog";

type MediaLibraryProps = {
  queryRef: MediaLibraryFragment$key;
  pageSize: number;
  uploadEndpoint: string;
};

type MediaNode = NonNullable<
  NonNullable<NonNullable<MediaLibraryFragment$data["medias"]>["edges"]>[number]
>["node"];

const mediaLibraryFragment = graphql`
  fragment MediaLibraryFragment on Query
  @refetchable(queryName: "MediaLibraryPaginationQuery")
  @argumentDefinitions(first: { type: "Int", defaultValue: 20 }, after: { type: "String" }) {
    medias(first: $first, after: $after) @connection(key: "MediaLibrary_medias") {
      totalCount
      edges {
        cursor
        node {
          id
          fileName
          mimeType
          fileSizeBytes
          uploadedByID
          createdAt
          updatedAt
          title
          altText
          caption
          description
          url
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export function MediaLibrary({ queryRef, pageSize, uploadEndpoint }: MediaLibraryProps) {
  const { data, hasNext, isLoadingNext, loadNext, refetch } = usePaginationFragment(
    mediaLibraryFragment,
    queryRef,
  );
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [isUploadOpen, setUploadOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const connection = data.medias;
  const edges = connection?.edges ?? [];
  const totalCount = connection?.totalCount ?? 0;

  const selectedMedia = useMemo<MediaNode | null>(() => {
    if (!selectedMediaId) {
      return null;
    }
    for (const edge of edges) {
      if (edge?.node?.id === selectedMediaId) {
        return edge.node;
      }
    }
    return null;
  }, [edges, selectedMediaId]);

  const handleLoadMore = useCallback(() => {
    if (!hasNext || isLoadingNext) {
      return;
    }
    loadNext(pageSize);
  }, [hasNext, isLoadingNext, loadNext, pageSize]);

  const handleRefresh = useCallback(() => {
    refetch({ first: pageSize, after: null }, { fetchPolicy: "network-only" });
  }, [pageSize, refetch]);

  const handleUploadSuccess = useCallback(
    (message: string) => {
      setStatusMessage(message);
      setErrorMessage(null);
      handleRefresh();
    },
    [handleRefresh],
  );

  const handleUploadError = useCallback((message: string) => {
    setErrorMessage(message);
    setStatusMessage(null);
  }, []);

  const handleEditSuccess = useCallback((message: string) => {
    setStatusMessage(message);
    setErrorMessage(null);
  }, []);

  const handleEditError = useCallback((message: string) => {
    setErrorMessage(message);
    setStatusMessage(null);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setSelectedMediaId(null);
  }, []);

  const emptyStateMessage =
    edges.length === 0
      ? "No media has been uploaded yet. Use the upload action to seed the library."
      : null;

  return (
    <div className="media-library">
      <div className="media-library__toolbar">
        <button type="button" onClick={() => setUploadOpen(true)}>
          Upload media
        </button>
        <span aria-live="polite">Total items: {totalCount}</span>
      </div>
      <div className="media-library__messages" aria-live="polite">
        {statusMessage ? <div role="status">{statusMessage}</div> : null}
        {errorMessage ? <div role="alert">{errorMessage}</div> : null}
      </div>
      <div className="media-library__table-container">
        <MediaTable edges={edges} onEdit={(mediaId) => setSelectedMediaId(mediaId)} emptyMessage={emptyStateMessage} />
      </div>
      <div className="media-library__actions">
        <button type="button" onClick={handleLoadMore} disabled={!hasNext || isLoadingNext}>
          {isLoadingNext ? "Loading…" : "Load more"}
        </button>
      </div>
      {isUploadOpen ? (
        <MediaUploadDialog
          uploadEndpoint={uploadEndpoint}
          onClose={() => setUploadOpen(false)}
          onSuccess={handleUploadSuccess}
          onError={handleUploadError}
        />
      ) : null}
      {selectedMedia ? (
        <MediaEditDialog
          media={selectedMedia}
          onClose={handleCloseDialog}
          onSuccess={handleEditSuccess}
          onError={handleEditError}
        />
      ) : null}
    </div>
  );
}
