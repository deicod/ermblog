import { useCallback, useMemo, useState } from "react";
import { graphql, usePaginationFragment, useMutation } from "react-relay";

import type { RolesManagerFragment$key } from "./__generated__/RolesManagerFragment.graphql";
import type { RolesManagerFragment$data } from "./__generated__/RolesManagerFragment.graphql";
import type { RolesManagerDeleteRoleMutation } from "./__generated__/RolesManagerDeleteRoleMutation.graphql";
import { RoleFormDialog } from "./RoleFormDialog";
import { RolesTable } from "./RolesTable";

export type RoleRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  capabilities: Record<string, unknown>;
  createdAt: string | null;
  updatedAt: string | null;
};

type RolesManagerProps = {
  queryRef: RolesManagerFragment$key;
  pageSize: number;
};

const rolesManagerFragment = graphql`
  fragment RolesManagerFragment on Query
  @refetchable(queryName: "RolesManagerPaginationQuery")
  @argumentDefinitions(first: { type: "Int", defaultValue: 20 }, after: { type: "String" }) {
    roles(first: $first, after: $after) @connection(key: "RolesManager_roles") {
      totalCount
      edges {
        cursor
        node {
          id
          name
          slug
          description
          capabilities
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

const deleteRoleMutation = graphql`
  mutation RolesManagerDeleteRoleMutation($input: DeleteRoleInput!) {
    deleteRole(input: $input) {
      deletedRoleID
    }
  }
`;

function normalizeCapabilities(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function normalizeRoles(connection: RolesManagerFragment$data | null | undefined): RoleRecord[] {
  const edges = connection?.roles?.edges ?? [];
  return edges
    .map((edge) => edge?.node)
    .filter((node): node is NonNullable<typeof node> => Boolean(node))
    .map((node) => ({
      id: node.id,
      name: node.name ?? "(unnamed role)",
      slug: node.slug ?? "(missing slug)",
      description: node.description ?? null,
      capabilities: normalizeCapabilities(node.capabilities),
      createdAt: node.createdAt ?? null,
      updatedAt: node.updatedAt ?? null,
    }));
}

export function RolesManager({ queryRef, pageSize }: RolesManagerProps) {
  const { data, hasNext, isLoadingNext, loadNext, refetch } = usePaginationFragment(
    rolesManagerFragment,
    queryRef,
  );

  const roles = useMemo(() => normalizeRoles(data), [data]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [commitDelete, isDeleting] = useMutation<RolesManagerDeleteRoleMutation>(deleteRoleMutation);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visibleRoles = useMemo(() => {
    if (!normalizedQuery) {
      return roles;
    }
    return roles.filter((role) => {
      const haystack = [
        role.name,
        role.slug,
        role.description ?? "",
        Object.keys(role.capabilities).join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery, roles]);

  const totalCount = data.roles?.totalCount ?? 0;

  const emptyMessage = normalizedQuery
    ? "No roles match the current search."
    : "No roles are available yet. Connect the API or create a role to populate this list.";

  const editingRole = useMemo(() => {
    if (!editingRoleId) {
      return null;
    }
    return roles.find((role) => role.id === editingRoleId) ?? null;
  }, [editingRoleId, roles]);

  const refreshRoles = useCallback(() => {
    refetch(
      { first: pageSize, after: null },
      {
        fetchPolicy: "network-only",
      },
    );
  }, [pageSize, refetch]);

  const handleLoadMore = useCallback(() => {
    if (!hasNext || isLoadingNext) {
      return;
    }
    loadNext(pageSize);
  }, [hasNext, isLoadingNext, loadNext, pageSize]);

  const updateStatusMessage = useCallback((message: string | null) => {
    setStatusMessage(message);
  }, []);

  const updateErrorMessage = useCallback((message: string | null) => {
    setErrorMessage(message);
  }, []);

  const handleCreateSuccess = useCallback(
    (message: string, options?: { roleId?: string }) => {
      updateStatusMessage(message);
      updateErrorMessage(null);
      setCreateOpen(false);
      if (options?.roleId) {
        setEditingRoleId(options.roleId);
      }
      refreshRoles();
    },
    [refreshRoles, updateErrorMessage, updateStatusMessage],
  );

  const handleCreateError = useCallback(
    (message: string) => {
      updateErrorMessage(message);
      updateStatusMessage(null);
    },
    [updateErrorMessage, updateStatusMessage],
  );

  const handleEditSuccess = useCallback(
    (message: string) => {
      updateStatusMessage(message);
      updateErrorMessage(null);
      setEditingRoleId(null);
      refreshRoles();
    },
    [refreshRoles, updateErrorMessage, updateStatusMessage],
  );

  const handleEditError = useCallback(
    (message: string) => {
      updateErrorMessage(message);
      updateStatusMessage(null);
    },
    [updateErrorMessage, updateStatusMessage],
  );

  const handleDeleteRole = useCallback(
    (roleId: string) => {
      const role = roles.find((entry) => entry.id === roleId);
      const confirmationMessage = role
        ? `Delete role “${role.name}”? This action cannot be undone.`
        : "Delete this role? This action cannot be undone.";

      const confirmed = window.confirm(confirmationMessage);
      if (!confirmed) {
        return;
      }

      commitDelete({
        variables: {
          input: { id: roleId },
        },
        onCompleted: () => {
          updateStatusMessage("Role deleted successfully.");
          updateErrorMessage(null);
          if (editingRoleId === roleId) {
            setEditingRoleId(null);
          }
          refreshRoles();
        },
        onError: (error) => {
          updateErrorMessage(error.message);
          updateStatusMessage(null);
        },
      });
    },
    [commitDelete, editingRoleId, refreshRoles, roles, updateErrorMessage, updateStatusMessage],
  );

  return (
    <div className="roles-manager">
      <div className="roles-manager__toolbar">
        <label className="roles-manager__search">
          <span>Search roles</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by role name or capability"
          />
        </label>
        <div className="roles-manager__primary-actions">
          <span className="roles-manager__summary" aria-live="polite">
            Showing {visibleRoles.length} of {totalCount} roles
          </span>
          <button
            type="button"
            className="roles-manager__button"
            onClick={() => {
              setCreateOpen(true);
              updateErrorMessage(null);
              updateStatusMessage(null);
            }}
          >
            New role
          </button>
        </div>
      </div>
      <div className="roles-manager__messages" aria-live="polite">
        {statusMessage ? <div role="status">{statusMessage}</div> : null}
        {errorMessage ? <div role="alert">{errorMessage}</div> : null}
      </div>
      <div className="roles-manager__table-container">
        <RolesTable
          roles={visibleRoles}
          emptyMessage={emptyMessage}
          disabled={isDeleting}
          onEdit={(roleId) => {
            setEditingRoleId(roleId);
            updateErrorMessage(null);
            updateStatusMessage(null);
          }}
          onDelete={handleDeleteRole}
        />
      </div>
      <div className="roles-manager__actions">
        <button
          type="button"
          className="roles-manager__load-more"
          onClick={handleLoadMore}
          disabled={!hasNext || isLoadingNext}
        >
          {isLoadingNext ? "Loading…" : "Load more"}
        </button>
      </div>
      {isCreateOpen ? (
        <RoleFormDialog
          mode="create"
          onClose={() => setCreateOpen(false)}
          onSuccess={handleCreateSuccess}
          onError={handleCreateError}
        />
      ) : null}
      {editingRole ? (
        <RoleFormDialog
          mode="edit"
          role={editingRole}
          onClose={() => setEditingRoleId(null)}
          onSuccess={handleEditSuccess}
          onError={handleEditError}
        />
      ) : null}
    </div>
  );
}

export default RolesManager;

