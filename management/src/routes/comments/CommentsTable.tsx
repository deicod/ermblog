import { useCallback, useMemo, useState } from "react";
import { graphql, useMutation, usePaginationFragment } from "react-relay";

import { StatusChip } from "./StatusChip";
import type {
  CommentStatus,
  CommentsTableFragment$data,
  CommentsTableFragment$key,
} from "./__generated__/CommentsTableFragment.graphql";
import type { CommentsTableUpdateCommentStatusMutation } from "./__generated__/CommentsTableUpdateCommentStatusMutation.graphql";
import {
  applyCommentStatusChangeToConnections,
  isKnownCommentStatus,
} from "./commentConnectionUtils";

type CommentsTableProps = {
  queryRef: CommentsTableFragment$key;
  pageSize: number;
};

const COMMENT_STATUS_OPTIONS = ["all", "pending", "approved", "spam", "trash"] as const;

type StatusFilterOption = (typeof COMMENT_STATUS_OPTIONS)[number];

const commentsTableFragment = graphql`
  fragment CommentsTableFragment on Query
  @refetchable(queryName: "CommentsTablePaginationQuery")
  @argumentDefinitions(
    first: { type: "Int", defaultValue: 20 }
    after: { type: "String" }
    status: { type: "CommentStatus" }
  ) {
    comments(first: $first, after: $after, status: $status)
      @connection(key: "CommentsTable_comments", filters: ["status"]) {
      totalCount
      edges {
        cursor
        node {
          id
          content
          status
          authorName
          submittedAt
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const updateCommentStatusMutation = graphql`
  mutation CommentsTableUpdateCommentStatusMutation($input: UpdateCommentInput!) {
    updateComment(input: $input) {
      comment {
        id
        status
      }
    }
  }
`;

type CommentEdge = NonNullable<
  NonNullable<CommentsTableFragment$data["comments"]>["edges"]
>[number];

type CommentNode = NonNullable<NonNullable<CommentEdge>["node"]>;

type CommentRowActionsProps = {
  comment: CommentNode;
  onActionStart: () => void;
  onError: (message: string) => void;
};

type CommentStatusAction = {
  label: string;
  nextStatus: CommentStatus;
};

const ACTIONS_BY_STATUS: Record<CommentStatus, CommentStatusAction[]> = {
  pending: [
    { label: "Approve", nextStatus: "approved" },
    { label: "Mark as spam", nextStatus: "spam" },
    { label: "Move to trash", nextStatus: "trash" },
  ],
  approved: [
    { label: "Mark as spam", nextStatus: "spam" },
    { label: "Move to trash", nextStatus: "trash" },
  ],
  spam: [
    { label: "Approve", nextStatus: "approved" },
    { label: "Move to trash", nextStatus: "trash" },
  ],
  trash: [{ label: "Restore", nextStatus: "pending" }],
};

function CommentRowActions({ comment, onActionStart, onError }: CommentRowActionsProps) {
  const { id: commentId, status } = comment;
  const commentStatus = isKnownCommentStatus(status) ? status : null;
  const actions = useMemo(() => {
    if (!commentStatus) {
      return [] as CommentStatusAction[];
    }
    return ACTIONS_BY_STATUS[commentStatus];
  }, [commentStatus]);

  const [commit, isInFlight] = useMutation<CommentsTableUpdateCommentStatusMutation>(
    updateCommentStatusMutation,
  );

  const handleAction = useCallback(
    (nextStatus: CommentStatus) => {
      if (!commentStatus) {
        return;
      }
      onActionStart();
      commit({
        variables: { input: { id: commentId, status: nextStatus } },
        optimisticResponse: {
          updateComment: {
            comment: {
              id: commentId,
              status: nextStatus,
            },
          },
        },
        optimisticUpdater: (store) =>
          applyCommentStatusChangeToConnections({
            store,
            commentId,
            previousStatus: commentStatus,
            nextStatus,
          }),
        updater: (store) =>
          applyCommentStatusChangeToConnections({
            store,
            commentId,
            previousStatus: commentStatus,
            nextStatus,
          }),
        onError: (error) => {
          const message = error?.message?.trim()
            ? `Failed to update comment status. ${error.message}`
            : "Failed to update comment status. Please try again.";
          onError(message);
        },
      });
    },
    [commentId, commentStatus, commit, onActionStart, onError],
  );

  if (!commentStatus || actions.length === 0) {
    return <span className="comments-table__row-actions comments-table__row-actions--empty">—</span>;
  }

  return (
    <div className="comments-table__row-actions">
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          onClick={() => handleAction(action.nextStatus)}
          disabled={isInFlight}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatSubmittedAt(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }
  return dateFormatter.format(parsed);
}

export function CommentsTable({ queryRef, pageSize }: CommentsTableProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>("all");
  const [actionError, setActionError] = useState<string | null>(null);
  const { data, loadNext, hasNext, isLoadingNext, refetch } = usePaginationFragment(
    commentsTableFragment,
    queryRef,
  );

  const connection = data.comments;
  const edges = connection?.edges ?? [];
  const totalCount = connection?.totalCount ?? 0;

  const handleStatusChange = useCallback(
    (nextStatus: StatusFilterOption) => {
      setStatusFilter(nextStatus);
      setActionError(null);
      refetch(
        {
          first: pageSize,
          status: nextStatus === "all" ? null : nextStatus,
          after: null,
        },
        { fetchPolicy: "network-only" },
      );
    },
    [pageSize, refetch],
  );

  const handleLoadMore = useCallback(() => {
    if (!hasNext || isLoadingNext) {
      return;
    }
    loadNext(pageSize);
  }, [hasNext, isLoadingNext, loadNext, pageSize]);

  const emptyStateMessage =
    statusFilter === "all"
      ? "No comments are available yet. Connect the API or collect feedback to populate this list."
      : `No comments match the “${statusFilter}” status.`;

  return (
    <div className="comments-table">
      {actionError ? (
        <div role="alert" className="comments-table__error" aria-live="assertive">
          {actionError}
        </div>
      ) : null}
      <div className="comments-table__toolbar">
        <label className="comments-table__filter">
          <span>Status</span>
          <select
            value={statusFilter}
            onChange={(event) =>
              handleStatusChange(event.target.value as StatusFilterOption)
            }
          >
            {COMMENT_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === "all"
                  ? "All statuses"
                  : option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <span className="comments-table__total" aria-live="polite">
          Total comments: {totalCount}
        </span>
      </div>
      <div className="comments-table__container">
        <table className="comments-table__table">
          <thead>
            <tr>
              <th scope="col">Comment</th>
              <th scope="col">Status</th>
              <th scope="col">Submitted</th>
              <th scope="col">Author</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {edges.length === 0 ? (
              <tr>
                <td colSpan={5} className="comments-table__empty">
                  {emptyStateMessage}
                </td>
              </tr>
            ) : (
              edges.map((edge, index) => {
                const node = edge?.node;
                if (!node) {
                  return (
                    <tr key={`placeholder-${index}`}>
                      <td colSpan={5} className="comments-table__empty">
                        Unable to load this comment entry.
                      </td>
                    </tr>
                  );
                }
                return (
                  <tr key={node.id}>
                    <td className="comments-table__content">{node.content}</td>
                    <td>
                      <StatusChip status={node.status} />
                    </td>
                    <td>{formatSubmittedAt(node.submittedAt)}</td>
                    <td>{node.authorName?.trim() || "Anonymous"}</td>
                    <td>
                      <CommentRowActions
                        comment={node}
                        onActionStart={() => setActionError(null)}
                        onError={setActionError}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="comments-table__actions">
        <button
          type="button"
          onClick={handleLoadMore}
          disabled={!hasNext || isLoadingNext}
          className="comments-table__load-more"
        >
          {isLoadingNext ? "Loading…" : "Load more"}
        </button>
      </div>
    </div>
  );
}
