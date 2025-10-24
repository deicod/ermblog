import { useCallback, useState } from "react";
import { graphql, usePaginationFragment } from "react-relay";

import { StatusChip } from "./StatusChip";
import type { CommentsTableFragment$key } from "./__generated__/CommentsTableFragment.graphql";

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
      <div className="comments-table__toolbar">
        <label className="comments-table__filter">
          <span>Status</span>
          <select
            value={statusFilter}
            onChange={(event) => handleStatusChange(event.target.value as StatusFilterOption)}
          >
            {COMMENT_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? "All statuses" : option.charAt(0).toUpperCase() + option.slice(1)}
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
            </tr>
          </thead>
          <tbody>
            {edges.length === 0 ? (
              <tr>
                <td colSpan={4} className="comments-table__empty">
                  {emptyStateMessage}
                </td>
              </tr>
            ) : (
              edges.map((edge, index) => {
                const node = edge?.node;
                if (!node) {
                  return (
                    <tr key={`placeholder-${index}`}>
                      <td colSpan={4} className="comments-table__empty">
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
