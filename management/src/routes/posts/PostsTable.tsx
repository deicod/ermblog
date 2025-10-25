import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { graphql, usePaginationFragment } from "react-relay";

import { StatusBadge } from "./StatusBadge";
import type { PostsTableFragment$key } from "./__generated__/PostsTableFragment.graphql";

const POST_STATUS_OPTIONS = [
  "all",
  "draft",
  "pending",
  "private",
  "published",
  "archived",
] as const;

type StatusFilterOption = (typeof POST_STATUS_OPTIONS)[number];

type PostsTableProps = {
  queryRef: PostsTableFragment$key;
  pageSize: number;
};

const postsTableFragment = graphql`
  fragment PostsTableFragment on Query
  @refetchable(queryName: "PostsTablePaginationQuery")
  @argumentDefinitions(
    first: { type: "Int", defaultValue: 10 }
    after: { type: "String" }
    status: { type: "PostStatus" }
  ) {
    posts(first: $first, after: $after, status: $status)
      @connection(key: "PostsTable_posts", filters: ["status"]) {
      totalCount
      edges {
        cursor
        node {
          id
          title
          status
          updatedAt
          authorID
          author {
            id
            displayName
            email
            username
          }
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

function formatUpdatedAt(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }
  return dateFormatter.format(parsed);
}

export function PostsTable({ queryRef, pageSize }: PostsTableProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>("all");
  const { data, loadNext, hasNext, isLoadingNext, refetch } = usePaginationFragment(
    postsTableFragment,
    queryRef,
  );

  const connection = data.posts;
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
      ? "No posts are available yet. Connect the API or create a post to populate this list."
      : `No posts match the “${statusFilter}” status.`;

  return (
    <div className="posts-table">
      <div className="posts-table__toolbar">
        <label className="posts-table__filter">
          <span>Status</span>
          <select
            value={statusFilter}
            onChange={(event) => handleStatusChange(event.target.value as StatusFilterOption)}
          >
            {POST_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? "All statuses" : option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <span className="posts-table__total" aria-live="polite">
          Total posts: {totalCount}
        </span>
      </div>
      <div className="posts-table__container">
        <table className="posts-table__table">
          <thead>
            <tr>
              <th scope="col">Title</th>
              <th scope="col">Status</th>
              <th scope="col">Last updated</th>
              <th scope="col">Author</th>
            </tr>
          </thead>
          <tbody>
            {edges.length === 0 ? (
              <tr>
                <td colSpan={4} className="posts-table__empty">
                  {emptyStateMessage}
                </td>
              </tr>
            ) : (
              edges.map((edge, index) => {
                const node = edge?.node;
                if (!node) {
                  return (
                    <tr key={`placeholder-${index}`}>
                      <td colSpan={4} className="posts-table__empty">
                        Unable to load this post entry.
                      </td>
                    </tr>
                  );
                }
                const authorLabel = formatAuthorLabel(node.author, node.authorID);
                return (
                  <tr key={node.id}>
                    <th scope="row">
                      <Link to={`/posts/${node.id}`} className="posts-table__title-link">
                        {node.title ?? "Untitled draft"}
                      </Link>
                    </th>
                    <td>
                      <StatusBadge status={node.status} />
                    </td>
                    <td>{formatUpdatedAt(node.updatedAt)}</td>
                    <td>{authorLabel}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="posts-table__actions">
        <button
          type="button"
          onClick={handleLoadMore}
          disabled={!hasNext || isLoadingNext}
          className="posts-table__load-more"
        >
          {isLoadingNext ? "Loading…" : "Load more"}
        </button>
      </div>
    </div>
  );
}

type AuthorInfo = {
  displayName?: string | null;
  email?: string | null;
  username?: string | null;
};

function formatAuthorLabel(author: AuthorInfo | null | undefined, authorID: string | null | undefined): string {
  const displayName = author?.displayName?.trim();
  if (displayName) {
    return displayName;
  }

  const email = author?.email?.trim();
  if (email) {
    return email;
  }

  const username = author?.username?.trim();
  if (username) {
    return username;
  }

  if (authorID && authorID.trim()) {
    return authorID;
  }

  return "Unknown author";
}
