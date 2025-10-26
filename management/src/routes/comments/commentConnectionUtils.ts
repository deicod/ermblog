import { ConnectionHandler, type RecordProxy, type RecordSourceSelectorProxy } from "relay-runtime";

import type { CommentStatus } from "./__generated__/CommentsTableFragment.graphql";

const COMMENT_CONNECTION_KEY = "CommentsTable_comments";
const COMMENT_EDGE_TYPE = "CommentEdge";

export const COMMENT_STATUS_FILTERS: ReadonlyArray<CommentStatus | null> = [
  null,
  "pending",
  "approved",
  "spam",
  "trash",
];

const KNOWN_COMMENT_STATUSES = new Set<CommentStatus>([
  "pending",
  "approved",
  "spam",
  "trash",
]);

export function isKnownCommentStatus(
  status: CommentStatus | null | undefined,
): status is CommentStatus {
  return status != null && KNOWN_COMMENT_STATUSES.has(status);
}

export function commentStatusMatches(
  filterStatus: CommentStatus | null,
  statusToMatch: CommentStatus,
): boolean {
  return filterStatus == null || filterStatus === statusToMatch;
}

export function getCommentConnection(
  store: RecordSourceSelectorProxy,
  status: CommentStatus | null,
) {
  const root = store.getRoot();
  if (status == null) {
    return (
      ConnectionHandler.getConnection(root, COMMENT_CONNECTION_KEY, { status: null }) ??
      ConnectionHandler.getConnection(root, COMMENT_CONNECTION_KEY)
    );
  }
  return ConnectionHandler.getConnection(root, COMMENT_CONNECTION_KEY, { status });
}

export function commentConnectionHasNode(
  connection: ReturnType<typeof getCommentConnection>,
  commentId: string,
): boolean {
  const edges = connection?.getLinkedRecords("edges");
  if (!edges) {
    return false;
  }
  return edges.some((edge) => edge?.getLinkedRecord("node")?.getDataID() === commentId);
}

export function adjustCommentTotalCount(
  connection: ReturnType<typeof getCommentConnection>,
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

export function insertCommentIntoConnections({
  store,
  commentRecord,
  status,
}: {
  store: RecordSourceSelectorProxy;
  commentRecord: RecordProxy;
  status: CommentStatus | null;
}) {
  const commentId = commentRecord.getDataID();
  COMMENT_STATUS_FILTERS.forEach((filterStatus) => {
    const connection = getCommentConnection(store, filterStatus);
    if (!connection) {
      return;
    }

    const matches =
      status && isKnownCommentStatus(status)
        ? commentStatusMatches(filterStatus, status)
        : filterStatus == null;

    if (!matches) {
      return;
    }

    if (commentConnectionHasNode(connection, commentId)) {
      return;
    }

    const edge = ConnectionHandler.createEdge(store, connection, commentRecord, COMMENT_EDGE_TYPE);
    ConnectionHandler.insertEdgeBefore(connection, edge);
    adjustCommentTotalCount(connection, 1);
  });
}

export function applyCommentStatusChangeToConnections({
  store,
  commentId,
  nextStatus,
}: {
  store: RecordSourceSelectorProxy;
  commentId: string;
  previousStatus?: CommentStatus | null;
  nextStatus: CommentStatus | null;
}) {
  const commentRecord = store.get(commentId);
  if (!commentRecord) {
    return;
  }

  const resolvedNextStatus = nextStatus && isKnownCommentStatus(nextStatus) ? nextStatus : null;
  commentRecord.setValue(resolvedNextStatus, "status");

  const existedInAnyConnection = COMMENT_STATUS_FILTERS.some((filterStatus) => {
    const connection = getCommentConnection(store, filterStatus);
    return connection ? commentConnectionHasNode(connection, commentId) : false;
  });

  COMMENT_STATUS_FILTERS.forEach((filterStatus) => {
    const connection = getCommentConnection(store, filterStatus);
    if (!connection) {
      return;
    }

    const hasNode = commentConnectionHasNode(connection, commentId);
    const shouldAppear =
      resolvedNextStatus != null
        ? commentStatusMatches(filterStatus, resolvedNextStatus)
        : filterStatus == null;

    if (hasNode && !shouldAppear) {
      ConnectionHandler.deleteNode(connection, commentId);
      adjustCommentTotalCount(connection, -1);
      return;
    }

    if (!hasNode && shouldAppear) {
      if (!existedInAnyConnection) {
        return;
      }
      const edge = ConnectionHandler.createEdge(store, connection, commentRecord, COMMENT_EDGE_TYPE);
      ConnectionHandler.insertEdgeBefore(connection, edge);
      adjustCommentTotalCount(connection, 1);
    }
  });
}

export function removeCommentFromConnections({
  store,
  commentId,
}: {
  store: RecordSourceSelectorProxy;
  commentId: string;
}) {
  let removedFromAnyConnection = false;

  COMMENT_STATUS_FILTERS.forEach((filterStatus) => {
    const connection = getCommentConnection(store, filterStatus);
    if (!connection) {
      return;
    }

    if (!commentConnectionHasNode(connection, commentId)) {
      return;
    }

    ConnectionHandler.deleteNode(connection, commentId);
    adjustCommentTotalCount(connection, -1);
    removedFromAnyConnection = true;
  });

  if (removedFromAnyConnection) {
    store.delete(commentId);
  }
}
