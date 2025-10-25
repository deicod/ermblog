import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RelayEnvironmentProvider } from "react-relay";
import { createMockEnvironment } from "relay-test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ROLES_PAGE_SIZE, RolesRoute } from "../../roles";

function renderRoles(environment = createMockEnvironment()) {
  render(
    <RelayEnvironmentProvider environment={environment}>
      <RolesRoute />
    </RelayEnvironmentProvider>,
  );

  return environment;
}

type RoleNodeInput = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  capabilities?: Record<string, unknown> | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

function buildRolesPayload(
  roles: RoleNodeInput[],
  pageInfo?: { hasNextPage?: boolean; endCursor?: string | null },
) {
  const edges = roles.map((role, index) => ({
    cursor: `cursor-${index + 1}`,
    node: {
      __typename: "Role",
      ...role,
      description: role.description ?? null,
      capabilities: role.capabilities ?? {},
      createdAt: role.createdAt ?? null,
      updatedAt: role.updatedAt ?? null,
    },
  }));

  return {
    roles: {
      __typename: "RoleConnection",
      totalCount: roles.length,
      edges,
      pageInfo: {
        __typename: "PageInfo",
        hasNextPage: pageInfo?.hasNextPage ?? false,
        hasPreviousPage: false,
        startCursor: edges[0]?.cursor ?? null,
        endCursor: pageInfo?.endCursor ?? edges[edges.length - 1]?.cursor ?? null,
      },
    },
  };
}

describe("RolesRoute", () => {
  let environment: ReturnType<typeof createMockEnvironment>;

  beforeEach(() => {
    environment = renderRoles();
  });

afterEach(() => {
  vi.restoreAllMocks();
  delete (window as typeof window & { confirm?: unknown }).confirm;
});

  it("renders role entries, shows capability summaries, and filters results", async () => {
    const initialOperation = environment.mock.getMostRecentOperation();
    expect(initialOperation.fragment.node.name).toBe("rolesRouteQuery");

    await act(async () => {
      environment.mock.resolve(initialOperation, {
        data: buildRolesPayload([
          {
            id: "role-1",
            name: "Administrator",
            slug: "administrator",
            description: "Full access to all features",
            capabilities: { manage_users: true, manage_roles: true, read: true },
            updatedAt: "2024-11-01T10:00:00.000Z",
          },
          {
            id: "role-2",
            name: "Editor",
            slug: "editor",
            description: "Publish and manage content",
            capabilities: { publish_posts: true, edit_posts: true, read: true },
            updatedAt: "2024-11-02T10:00:00.000Z",
          },
        ]),
      });
    });

    const table = await screen.findByRole("table", { name: "Roles" });
    const adminRow = within(table).getByRole("row", { name: /Administrator/ });
    expect(within(adminRow).getByText(/manage_users/)).toBeInTheDocument();
    expect(within(adminRow).getByText(/3 capabilities/)).toBeInTheDocument();

    const editorRow = within(table).getByRole("row", { name: /Editor/ });
    expect(within(editorRow).getByText(/publish_posts/)).toBeInTheDocument();

    const searchField = screen.getByLabelText("Search roles");
    await userEvent.clear(searchField);
    await userEvent.type(searchField, "admin");

    expect(within(table).getByRole("row", { name: /Administrator/ })).toBeInTheDocument();
    expect(within(table).queryByRole("row", { name: /Editor/ })).not.toBeInTheDocument();
  });

  it("renders an empty state when no roles are present", async () => {
    const initialOperation = environment.mock.getMostRecentOperation();

    await act(async () => {
      environment.mock.resolve(initialOperation, { data: buildRolesPayload([]) });
    });

    const table = await screen.findByRole("table", { name: "Roles" });
    expect(within(table).getByText(/No roles are available yet/)).toBeInTheDocument();
  });

  it("creates a role via the dialog form", async () => {
    const initialOperation = environment.mock.getMostRecentOperation();

    await act(async () => {
      environment.mock.resolve(initialOperation, { data: buildRolesPayload([]) });
    });

    await userEvent.click(screen.getByRole("button", { name: "New role" }));
    await userEvent.type(screen.getByLabelText("Name"), "Support");
    await userEvent.type(screen.getByLabelText("Slug"), "support");
    await userEvent.type(screen.getByLabelText("Description"), "Assist end users");
    await userEvent.clear(screen.getByLabelText("Capabilities JSON"));
    fireEvent.change(screen.getByLabelText("Capabilities JSON"), {
      target: { value: '{"read":true,"respond_tickets":true}' },
    });

    await userEvent.click(screen.getByRole("button", { name: "Create role" }));

    const mutationOperation = environment.mock.getMostRecentOperation();
    expect(mutationOperation.fragment.node.name).toBe("RoleFormDialogCreateRoleMutation");
    expect(mutationOperation.request.variables.input).toMatchObject({
      name: "Support",
      slug: "support",
      description: "Assist end users",
      capabilities: { read: true, respond_tickets: true },
    });

    await act(async () => {
      environment.mock.resolve(mutationOperation, {
        data: {
          createRole: {
            __typename: "CreateRolePayload",
            role: {
              __typename: "Role",
              id: "role-3",
              name: "Support",
              slug: "support",
              description: "Assist end users",
              capabilities: { read: true, respond_tickets: true },
              createdAt: "2024-11-05T10:00:00.000Z",
              updatedAt: "2024-11-05T10:00:00.000Z",
            },
          },
        },
      });
    });

    const refreshOperation = environment.mock.getMostRecentOperation();
    expect(refreshOperation.fragment.node.name).toBe("RolesManagerPaginationQuery");
    expect(refreshOperation.request.variables).toMatchObject({ first: ROLES_PAGE_SIZE });
  });

  it("surfaces an error when creating a role fails", async () => {
    const initialOperation = environment.mock.getMostRecentOperation();

    await act(async () => {
      environment.mock.resolve(initialOperation, { data: buildRolesPayload([]) });
    });

    await userEvent.click(screen.getByRole("button", { name: "New role" }));
    await userEvent.type(screen.getByLabelText("Name"), "Support");
    await userEvent.type(screen.getByLabelText("Slug"), "support");
    await userEvent.click(screen.getByRole("button", { name: "Create role" }));

    const mutationOperation = environment.mock.getMostRecentOperation();
    await act(async () => {
      environment.mock.reject(mutationOperation, new Error("mutation failed"));
    });

    expect(await screen.findByRole("alert")).toHaveTextContent("mutation failed");
  });

  it("updates a role when saving changes", async () => {
    const initialOperation = environment.mock.getMostRecentOperation();

    await act(async () => {
      environment.mock.resolve(initialOperation, {
        data: buildRolesPayload([
          {
            id: "role-1",
            name: "Support",
            slug: "support",
            description: "Assist end users",
            capabilities: { read: true },
            updatedAt: "2024-11-05T10:00:00.000Z",
          },
        ]),
      });
    });

    await userEvent.click(screen.getByRole("button", { name: "Edit role" }));
    const capabilitiesField = await screen.findByLabelText("Capabilities JSON");
    await userEvent.clear(capabilitiesField);
    fireEvent.change(capabilitiesField, {
      target: { value: '{"read":true,"respond_tickets":true}' },
    });
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    const mutationOperation = environment.mock.getMostRecentOperation();
    expect(mutationOperation.fragment.node.name).toBe("RoleFormDialogUpdateRoleMutation");
    expect(mutationOperation.request.variables.input).toMatchObject({
      id: "role-1",
      capabilities: { read: true, respond_tickets: true },
    });

    await act(async () => {
      environment.mock.resolve(mutationOperation, {
        data: {
          updateRole: {
            __typename: "UpdateRolePayload",
            role: {
              __typename: "Role",
              id: "role-1",
              name: "Support",
              slug: "support",
              description: "Assist end users",
              capabilities: { read: true, respond_tickets: true },
              createdAt: "2024-11-05T10:00:00.000Z",
              updatedAt: "2024-11-06T09:30:00.000Z",
            },
          },
        },
      });
    });

    const refreshOperation = environment.mock.getMostRecentOperation();
    expect(refreshOperation.fragment.node.name).toBe("RolesManagerPaginationQuery");
  });

  it("reports update failures", async () => {
    const initialOperation = environment.mock.getMostRecentOperation();

    await act(async () => {
      environment.mock.resolve(initialOperation, {
        data: buildRolesPayload([
          {
            id: "role-1",
            name: "Support",
            slug: "support",
            capabilities: { read: true },
          },
        ]),
      });
    });

    await userEvent.click(screen.getByRole("button", { name: "Edit role" }));
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    const mutationOperation = environment.mock.getMostRecentOperation();
    await act(async () => {
      environment.mock.reject(mutationOperation, new Error("update failed"));
    });

    expect(await screen.findByRole("alert")).toHaveTextContent("update failed");
  });

  it("deletes a role after confirming the action", async () => {
    const initialOperation = environment.mock.getMostRecentOperation();

    await act(async () => {
      environment.mock.resolve(initialOperation, {
        data: buildRolesPayload([
          {
            id: "role-1",
            name: "Support",
            slug: "support",
            capabilities: { read: true },
          },
        ]),
      });
    });

    const confirmMock = vi.fn().mockReturnValue(true);
    Object.defineProperty(window, "confirm", {
      value: confirmMock,
      configurable: true,
    });

    await userEvent.click(screen.getByRole("button", { name: "Delete role" }));

    const mutationOperation = environment.mock.getMostRecentOperation();
    expect(mutationOperation.fragment.node.name).toBe("RolesManagerDeleteRoleMutation");
    expect(mutationOperation.request.variables.input).toMatchObject({ id: "role-1" });

    await act(async () => {
      environment.mock.resolve(mutationOperation, {
        data: {
          deleteRole: {
            __typename: "DeleteRolePayload",
            deletedRoleID: "role-1",
          },
        },
      });
    });

    const refreshOperation = environment.mock.getMostRecentOperation();
    expect(refreshOperation.fragment.node.name).toBe("RolesManagerPaginationQuery");
  });

  it("handles delete failures and leaves the row intact", async () => {
    const initialOperation = environment.mock.getMostRecentOperation();

    await act(async () => {
      environment.mock.resolve(initialOperation, {
        data: buildRolesPayload([
          {
            id: "role-1",
            name: "Support",
            slug: "support",
            capabilities: { read: true },
          },
        ]),
      });
    });

    const confirmMock = vi.fn().mockReturnValue(true);
    Object.defineProperty(window, "confirm", {
      value: confirmMock,
      configurable: true,
    });

    await userEvent.click(screen.getByRole("button", { name: "Delete role" }));

    const mutationOperation = environment.mock.getMostRecentOperation();
    await act(async () => {
      environment.mock.reject(mutationOperation, new Error("delete failed"));
    });

    expect(await screen.findByRole("alert")).toHaveTextContent("delete failed");
    const table = screen.getByRole("table", { name: "Roles" });
    expect(within(table).getByRole("row", { name: /Support/ })).toBeInTheDocument();
  });
});

