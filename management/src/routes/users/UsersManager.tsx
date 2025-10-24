import { useCallback, useMemo, useState } from "react";
import { graphql, usePaginationFragment } from "react-relay";

import type { UsersManagerFragment$key } from "./__generated__/UsersManagerFragment.graphql";
import type { UsersManagerFragment$data } from "./__generated__/UsersManagerFragment.graphql";
import { UserCreateDialog, UserEditDialog } from "./UserFormDialog";
import { UsersTable } from "./UsersTable";

export type UserRecord = {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  bio: string | null;
  avatarURL: string | null;
  websiteURL: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type UsersManagerProps = {
  queryRef: UsersManagerFragment$key;
  pageSize: number;
};

const usersManagerFragment = graphql`
  fragment UsersManagerFragment on Query
  @refetchable(queryName: "UsersManagerPaginationQuery")
  @argumentDefinitions(first: { type: "Int", defaultValue: 20 }, after: { type: "String" }) {
    users(first: $first, after: $after) @connection(key: "UsersManager_users") {
      totalCount
      edges {
        cursor
        node {
          id
          username
          email
          displayName
          bio
          avatarURL
          websiteURL
          createdAt
          updatedAt
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

function normalizeUsers(data: UsersManagerFragment$data | null | undefined): UserRecord[] {
  const edges = data?.users?.edges ?? [];
  return edges
    .map((edge) => edge?.node)
    .filter((node): node is NonNullable<typeof node> => Boolean(node))
    .map((node) => ({
      id: node.id,
      username: node.username ?? "(unknown)",
      email: node.email ?? "(missing email)",
      displayName: node.displayName ?? null,
      bio: node.bio ?? null,
      avatarURL: node.avatarURL ?? null,
      websiteURL: node.websiteURL ?? null,
      createdAt: node.createdAt ?? null,
      updatedAt: node.updatedAt ?? null,
    }));
}

export function UsersManager({ queryRef, pageSize }: UsersManagerProps) {
  const { data, hasNext, isLoadingNext, loadNext, refetch } = usePaginationFragment(
    usersManagerFragment,
    queryRef,
  );

  const users = useMemo(() => normalizeUsers(data), [data]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const visibleUsers = useMemo(() => {
    if (!normalizedQuery) {
      return users;
    }
    return users.filter((user) => {
      const haystack = [
        user.username,
        user.email,
        user.displayName ?? "",
        user.websiteURL ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery, users]);

  const totalCount = data.users?.totalCount ?? 0;

  const emptyMessage = normalizedQuery
    ? "No users match the current search."
    : "No users are available yet. Connect the API or create an account to populate this list.";

  const editingUser = useMemo(() => {
    if (!editingUserId) {
      return null;
    }
    return users.find((user) => user.id === editingUserId) ?? null;
  }, [editingUserId, users]);

  const handleLoadMore = useCallback(() => {
    if (!hasNext || isLoadingNext) {
      return;
    }
    loadNext(pageSize);
  }, [hasNext, isLoadingNext, loadNext, pageSize]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const updateStatusMessage = useCallback((value: string | null) => {
    setStatusMessage(value);
  }, []);

  const refreshUsers = useCallback(() => {
    refetch(
      { first: pageSize, after: null },
      {
        fetchPolicy: "network-only",
      },
    );
  }, [pageSize, refetch]);

  const handleCreateSuccess = useCallback(
    (message: string, _options?: { userId?: string }) => {
      updateStatusMessage(message);
      setErrorMessage(null);
      setCreateOpen(false);
      refreshUsers();
    },
    [refreshUsers, updateStatusMessage],
  );

  const handleCreateError = useCallback((message: string) => {
    setErrorMessage(message);
    updateStatusMessage(null);
  }, [updateStatusMessage]);

  const handleEditSuccess = useCallback(
    (message: string) => {
      updateStatusMessage(message);
      setErrorMessage(null);
      setEditingUserId(null);
      refreshUsers();
    },
    [refreshUsers, updateStatusMessage],
  );

  const handleEditError = useCallback((message: string) => {
    setErrorMessage(message);
    updateStatusMessage(null);
  }, [updateStatusMessage]);

  return (
    <div className="users-manager">
      <div className="users-manager__toolbar">
        <label className="users-manager__search">
          <span>Search users</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search by username, email, or profile"
          />
        </label>
        <div className="users-manager__primary-actions">
          <span className="users-manager__summary" aria-live="polite">
            Showing {visibleUsers.length} of {totalCount} users
          </span>
          <button
            type="button"
            className="users-manager__button"
            onClick={() => {
              setCreateOpen(true);
              setErrorMessage(null);
              updateStatusMessage(null);
            }}
          >
            New user
          </button>
        </div>
      </div>
      <div className="users-manager__messages" aria-live="polite">
        {statusMessage ? <div role="status">{statusMessage}</div> : null}
        {errorMessage ? <div role="alert">{errorMessage}</div> : null}
      </div>
      <div className="users-manager__table-container">
        <UsersTable
          users={visibleUsers}
          emptyMessage={emptyMessage}
          onEdit={(userId) => {
            setEditingUserId(userId);
            setErrorMessage(null);
            updateStatusMessage(null);
          }}
        />
      </div>
      <div className="users-manager__actions">
        <button
          type="button"
          className="users-manager__load-more"
          onClick={handleLoadMore}
          disabled={!hasNext || isLoadingNext}
        >
          {isLoadingNext ? "Loading…" : "Load more"}
        </button>
      </div>
      {isCreateOpen ? (
        <UserCreateDialog
          onClose={() => setCreateOpen(false)}
          onSuccess={handleCreateSuccess}
          onError={handleCreateError}
        />
      ) : null}
      {editingUser ? (
        <UserEditDialog
          user={editingUser}
          onClose={() => setEditingUserId(null)}
          onSuccess={handleEditSuccess}
          onError={handleEditError}
        />
      ) : null}
    </div>
  );
}

export default UsersManager;
