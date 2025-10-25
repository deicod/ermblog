import { ConnectionHandler, type RecordProxy, type RecordSourceSelectorProxy } from "relay-runtime";

import type { PostStatus } from "./__generated__/PostsTableFragment.graphql";

const POSTS_CONNECTION_KEY = "PostsTable_posts";
const POST_EDGE_TYPE = "PostEdge";

export const POST_STATUS_FILTERS: ReadonlyArray<PostStatus | null> = [
  null,
  "draft",
  "pending",
  "private",
  "published",
  "archived",
];

const KNOWN_POST_STATUSES = new Set<PostStatus>([
  "draft",
  "pending",
  "private",
  "published",
  "archived",
]);

export function isKnownPostStatus(status: PostStatus | null | undefined): status is PostStatus {
  return status != null && KNOWN_POST_STATUSES.has(status);
}

export function postStatusMatches(
  filterStatus: PostStatus | null,
  statusToMatch: PostStatus,
): boolean {
  return filterStatus == null || filterStatus === statusToMatch;
}

export function getPostConnection(store: RecordSourceSelectorProxy, status: PostStatus | null) {
  const root = store.getRoot();
  if (status == null) {
    return (
      ConnectionHandler.getConnection(root, POSTS_CONNECTION_KEY, { status: null }) ??
      ConnectionHandler.getConnection(root, POSTS_CONNECTION_KEY)
    );
  }
  return ConnectionHandler.getConnection(root, POSTS_CONNECTION_KEY, { status });
}

export function postConnectionHasNode(
  connection: ReturnType<typeof getPostConnection>,
  postId: string,
): boolean {
  const edges = connection?.getLinkedRecords("edges");
  if (!edges) {
    return false;
  }
  return edges.some((edge) => edge?.getLinkedRecord("node")?.getDataID() === postId);
}

export function adjustPostTotalCount(
  connection: ReturnType<typeof getPostConnection>,
  delta: number,
) {
  if (!connection || delta === 0) {
    return;
  }
  const currentValue = connection.getValue("totalCount");
  if (typeof currentValue !== "number") {
    return;
  }
  const nextValue = Math.max(0, currentValue + delta);
  connection.setValue(nextValue, "totalCount");
}

export function insertPostIntoConnections({
  store,
  postRecord,
  status,
}: {
  store: RecordSourceSelectorProxy;
  postRecord: RecordProxy;
  status: PostStatus | null;
}) {
  const postId = postRecord.getDataID();
  POST_STATUS_FILTERS.forEach((filterStatus) => {
    const connection = getPostConnection(store, filterStatus);
    if (!connection) {
      return;
    }

    const matches =
      status && isKnownPostStatus(status)
        ? postStatusMatches(filterStatus, status)
        : filterStatus == null;

    if (!matches) {
      return;
    }

    if (postConnectionHasNode(connection, postId)) {
      return;
    }

    const edge = ConnectionHandler.createEdge(store, connection, postRecord, POST_EDGE_TYPE);
    ConnectionHandler.insertEdgeBefore(connection, edge);
    adjustPostTotalCount(connection, 1);
  });
}

export function applyPostStatusChangeToConnections({
  store,
  postId,
  nextStatus,
}: {
  store: RecordSourceSelectorProxy;
  postId: string;
  previousStatus?: PostStatus | null;
  nextStatus: PostStatus | null;
}) {
  const postRecord = store.get(postId);
  if (!postRecord) {
    return;
  }

  const resolvedNextStatus = nextStatus && isKnownPostStatus(nextStatus) ? nextStatus : null;
  postRecord.setValue(resolvedNextStatus, "status");

  POST_STATUS_FILTERS.forEach((filterStatus) => {
    const connection = getPostConnection(store, filterStatus);
    if (!connection) {
      return;
    }

    const hasNode = postConnectionHasNode(connection, postId);
    const shouldAppear =
      resolvedNextStatus != null
        ? postStatusMatches(filterStatus, resolvedNextStatus)
        : filterStatus == null;

    if (hasNode && !shouldAppear) {
      ConnectionHandler.deleteNode(connection, postId);
      adjustPostTotalCount(connection, -1);
      return;
    }

    if (!hasNode && shouldAppear) {
      const edge = ConnectionHandler.createEdge(store, connection, postRecord, POST_EDGE_TYPE);
      ConnectionHandler.insertEdgeBefore(connection, edge);
      adjustPostTotalCount(connection, 1);
    }
  });
}
