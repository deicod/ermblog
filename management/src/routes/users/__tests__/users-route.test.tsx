import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RelayEnvironmentProvider } from "react-relay";
import { createMockEnvironment } from "relay-test-utils";
import { describe, expect, it, vi } from "vitest";

import { USERS_PAGE_SIZE, UsersRoute } from "../../users";

function renderUsers(environment = createMockEnvironment()) {
  render(
    <RelayEnvironmentProvider environment={environment}>
      <UsersRoute />
    </RelayEnvironmentProvider>,
  );
  return environment;
}

type UserNodeInput = {
  id: string;
  username: string;
  email: string;
  displayName?: string | null;
  bio?: string | null;
  avatarURL?: string | null;
  websiteURL?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  roles?: ReadonlyArray<{ id: string; name: string }>;
};

type PayloadOptions = {
  pageInfo?: { hasNextPage?: boolean; endCursor?: string | null };
  availableRoles?: ReadonlyArray<{ id: string; name: string }>;
};

function buildUsersPayload(users: UserNodeInput[], options?: PayloadOptions) {
  const edges = users.map((user, index) => ({
    cursor: `cursor-${index + 1}`,
    node: {
      __typename: "User",
      ...user,
      displayName: user.displayName ?? null,
      bio: user.bio ?? null,
      avatarURL: user.avatarURL ?? null,
      websiteURL: user.websiteURL ?? null,
      createdAt: user.createdAt ?? null,
      updatedAt: user.updatedAt ?? null,
      roles: {
        __typename: "RoleConnection",
        edges: (user.roles ?? []).map((role, roleIndex) => ({
          __typename: "RoleEdge",
          cursor: `role-${user.id}-${roleIndex}`,
          node: {
            __typename: "Role",
            id: role.id,
            name: role.name,
          },
        })),
      },
    },
  }));

  return {
    users: {
      __typename: "UserConnection",
      totalCount: users.length,
      edges,
      pageInfo: {
        __typename: "PageInfo",
        hasNextPage: options?.pageInfo?.hasNextPage ?? false,
        hasPreviousPage: false,
        startCursor: edges[0]?.cursor ?? null,
        endCursor: options?.pageInfo?.endCursor ?? edges[edges.length - 1]?.cursor ?? null,
      },
    },
    roles: {
      __typename: "RoleConnection",
      edges: (options?.availableRoles ?? []).map((role, index) => ({
        __typename: "RoleEdge",
        cursor: `available-role-${index}`,
        node: {
          __typename: "Role",
          id: role.id,
          name: role.name,
        },
      })),
    },
  };
}

describe("UsersRoute", () => {
  it("renders account records and filters them with the search box", async () => {
    const environment = renderUsers();
    const initialOperation = environment.mock.getMostRecentOperation();
    expect(initialOperation.fragment.node.name).toBe("usersRouteQuery");

    await act(async () => {
      environment.mock.resolve(initialOperation, {
        data: buildUsersPayload(
          [
            {
              id: "user-1",
              username: "opslead",
              email: "ops@example.com",
              displayName: "Operations Lead",
              bio: "Keeps the trains running on time.",
              websiteURL: "https://ops.example.com",
              updatedAt: "2024-10-10T10:00:00.000Z",
              createdAt: "2024-10-09T10:00:00.000Z",
              roles: [{ id: "role-admin", name: "Administrator" }],
            },
            {
              id: "user-2",
              username: "editor",
              email: "editor@example.com",
              displayName: "Chief Editor",
              bio: "Reviews and publishes content.",
              avatarURL: "https://cdn.example/editor.png",
              updatedAt: "2024-10-11T09:15:00.000Z",
              createdAt: "2024-10-09T08:00:00.000Z",
              roles: [{ id: "role-editor", name: "Editor" }],
            },
          ],
          {
            availableRoles: [
              { id: "role-admin", name: "Administrator" },
              { id: "role-editor", name: "Editor" },
            ],
          },
        ),
      });
    });

    const table = await screen.findByRole("table");
    const opsRow = within(table).getByRole("row", { name: /opslead/i });
    expect(within(opsRow).getByText("Operations Lead")).toBeInTheDocument();
    expect(within(opsRow).getByText("ops@example.com")).toBeInTheDocument();
    expect(within(opsRow).getByText("https://ops.example.com")).toBeInTheDocument();
    expect(within(opsRow).getByText("Administrator")).toBeInTheDocument();

    const editorRow = within(table).getByRole("row", { name: /editor/i });
    expect(within(editorRow).getByText("Chief Editor")).toBeInTheDocument();
    expect(within(editorRow).getByText("https://cdn.example/editor.png")).toBeInTheDocument();
    expect(within(editorRow).getByText("Editor")).toBeInTheDocument();

    const searchInput = screen.getByLabelText("Search users");
    await userEvent.clear(searchInput);
    await userEvent.type(searchInput, "ops");

    expect(screen.getByRole("row", { name: /opslead/i })).toBeInTheDocument();
    expect(screen.queryByRole("row", { name: /editor/i })).not.toBeInTheDocument();
  });

  it("loads additional pages when requesting more users", async () => {
    const environment = renderUsers();
    const initialOperation = environment.mock.getMostRecentOperation();

    await act(async () => {
      environment.mock.resolve(initialOperation, {
        data: buildUsersPayload(
          [
            {
              id: "user-1",
              username: "first",
              email: "first@example.com",
              createdAt: "2024-10-10T09:00:00.000Z",
            },
          ],
          { pageInfo: { hasNextPage: true, endCursor: "cursor-1" } },
        ),
      });
    });

    const resolver = vi.fn((operation: any) => {
      expect(operation.fragment.node.name).toBe("UsersManagerPaginationQuery");
      expect(operation.request.variables).toMatchObject({ first: USERS_PAGE_SIZE });
      return {
        data: buildUsersPayload(
          [
            {
              id: "user-2",
              username: "second",
              email: "second@example.com",
              createdAt: "2024-10-12T11:00:00.000Z",
            },
          ],
          { pageInfo: { hasNextPage: false, endCursor: "cursor-2" } },
        ),
      };
    });
    environment.mock.queueOperationResolver(resolver);

    const loadMoreButton = await screen.findByRole("button", { name: "Load more" });
    await act(async () => {
      await userEvent.click(loadMoreButton);
    });

    expect(resolver).toHaveBeenCalledTimes(1);
  });

  it("creates a user through the dialog form", async () => {
    const environment = renderUsers();
    const initialOperation = environment.mock.getMostRecentOperation();

    await act(async () => {
      environment.mock.resolve(initialOperation, {
        data: buildUsersPayload([], {
          availableRoles: [
            { id: "role-admin", name: "Administrator" },
            { id: "role-editor", name: "Editor" },
          ],
        }),
      });
    });

    await userEvent.click(screen.getByRole("button", { name: "New user" }));

    await userEvent.type(screen.getByLabelText("Username"), "analyst");
    await userEvent.type(screen.getByLabelText("Email"), "analyst@example.com");
    await userEvent.type(screen.getByLabelText("Display name"), "Data Analyst");
    await userEvent.type(screen.getByLabelText("Password"), "Sup3rSecret!");
    await userEvent.type(screen.getByLabelText("Confirm password"), "Sup3rSecret!");
    await userEvent.type(screen.getByLabelText("Website"), "https://data.example.com");
    await userEvent.type(screen.getByLabelText("Avatar URL"), "https://cdn.example/analyst.png");
    await userEvent.type(screen.getByLabelText("Bio"), "Transforms data into actionable insight.");
    await userEvent.click(screen.getByRole("checkbox", { name: "Administrator" }));

    await userEvent.click(screen.getByRole("button", { name: "Create user" }));

    const mutationOperation = environment.mock.getMostRecentOperation();
    expect(mutationOperation.fragment.node.name).toBe("UserFormDialogCreateUserMutation");
    expect(mutationOperation.request.variables.input).toMatchObject({
      username: "analyst",
      email: "analyst@example.com",
      displayName: "Data Analyst",
      websiteURL: "https://data.example.com",
      password: "Sup3rSecret!",
    });

    await act(async () => {
      environment.mock.resolve(mutationOperation, {
        data: {
          createUser: {
            __typename: "CreateUserPayload",
            user: {
              __typename: "User",
              id: "user-3",
              username: "analyst",
              email: "analyst@example.com",
              displayName: "Data Analyst",
              bio: "Transforms data into actionable insight.",
              avatarURL: "https://cdn.example/analyst.png",
              websiteURL: "https://data.example.com",
              createdAt: "2024-10-12T09:00:00.000Z",
              updatedAt: "2024-10-12T09:00:00.000Z",
            },
          },
        },
      });
    });

    const assignOperation = environment.mock.getMostRecentOperation();
    expect(assignOperation.fragment.node.name).toBe("UserFormDialogAssignUserRolesMutation");
    expect(assignOperation.request.variables.input).toMatchObject({
      userID: "user-3",
      roleIDs: ["role-admin"],
    });

    await act(async () => {
      environment.mock.resolve(assignOperation, {
        data: {
          assignUserRoles: {
            __typename: "AssignUserRolesPayload",
            user: { __typename: "User", id: "user-3" },
          },
        },
      });
    });

    const refreshOperation = environment.mock.getMostRecentOperation();
    expect(refreshOperation.fragment.node.name).toBe("UsersManagerPaginationQuery");
    expect(refreshOperation.request.variables).toMatchObject({ first: USERS_PAGE_SIZE });

    await act(async () => {
      environment.mock.resolve(refreshOperation, {
        data: buildUsersPayload([
          {
            id: "user-3",
            username: "analyst",
            email: "analyst@example.com",
            displayName: "Data Analyst",
            bio: "Transforms data into actionable insight.",
            avatarURL: "https://cdn.example/analyst.png",
            websiteURL: "https://data.example.com",
            createdAt: "2024-10-12T09:00:00.000Z",
            updatedAt: "2024-10-12T09:00:00.000Z",
            roles: [{ id: "role-admin", name: "Administrator" }],
          },
        ], {
          availableRoles: [
            { id: "role-admin", name: "Administrator" },
            { id: "role-editor", name: "Editor" },
          ],
        }),
      });
    });

    await screen.findByText("User created successfully.");
    expect(screen.queryByRole("dialog", { name: /Create new user/i })).not.toBeInTheDocument();
  });

  it("updates a user profile via the edit dialog", async () => {
    const environment = renderUsers();
    const initialOperation = environment.mock.getMostRecentOperation();

    await act(async () => {
      environment.mock.resolve(initialOperation, {
        data: buildUsersPayload(
          [
            {
              id: "user-2",
              username: "reviewer",
              email: "reviewer@example.com",
              displayName: "Content Reviewer",
              bio: "Reviews submissions before publishing.",
              updatedAt: "2024-10-11T10:00:00.000Z",
              createdAt: "2024-10-10T08:00:00.000Z",
              roles: [{ id: "role-editor", name: "Editor" }],
            },
          ],
          {
            availableRoles: [
              { id: "role-admin", name: "Administrator" },
              { id: "role-editor", name: "Editor" },
              { id: "role-viewer", name: "Viewer" },
            ],
          },
        ),
      });
    });

    await userEvent.click(screen.getByRole("button", { name: "Edit user" }));
    await userEvent.clear(screen.getByLabelText("Display name"));
    await userEvent.type(screen.getByLabelText("Display name"), "Senior Reviewer");
    await userEvent.clear(screen.getByLabelText("Bio"));
    await userEvent.type(screen.getByLabelText("Bio"), "Mentors the review team and ensures standards.");

    const adminRole = screen.getByRole("checkbox", { name: "Administrator" });
    const editorRole = screen.getByRole("checkbox", { name: "Editor" });
    const viewerRole = screen.getByRole("checkbox", { name: "Viewer" });

    expect(adminRole).not.toBeChecked();
    expect(editorRole).toBeChecked();
    expect(viewerRole).not.toBeChecked();

    await userEvent.click(adminRole);
    await userEvent.click(editorRole);

    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    const mutationOperation = environment.mock.getMostRecentOperation();
    expect(mutationOperation.fragment.node.name).toBe("UserFormDialogUpdateUserMutation");
    expect(mutationOperation.request.variables.input).toMatchObject({
      id: "user-2",
      displayName: "Senior Reviewer",
    });

    await act(async () => {
      environment.mock.resolve(mutationOperation, {
        data: {
          updateUser: {
            __typename: "UpdateUserPayload",
            user: {
              __typename: "User",
              id: "user-2",
              username: "reviewer",
              email: "reviewer@example.com",
              displayName: "Senior Reviewer",
              bio: "Mentors the review team and ensures standards.",
              avatarURL: null,
              websiteURL: null,
              createdAt: "2024-10-10T08:00:00.000Z",
              updatedAt: "2024-10-12T08:00:00.000Z",
            },
          },
        },
      });
    });

    const assignOperation = environment.mock.getMostRecentOperation();
    expect(assignOperation.fragment.node.name).toBe("UserFormDialogAssignUserRolesMutation");
    expect(assignOperation.request.variables.input).toMatchObject({
      userID: "user-2",
      roleIDs: ["role-admin"],
    });

    await act(async () => {
      environment.mock.resolve(assignOperation, {
        data: {
          assignUserRoles: {
            __typename: "AssignUserRolesPayload",
            user: { __typename: "User", id: "user-2" },
          },
        },
      });
    });

    const removeOperation = environment.mock.getMostRecentOperation();
    expect(removeOperation.fragment.node.name).toBe("UserFormDialogRemoveUserRolesMutation");
    expect(removeOperation.request.variables.input).toMatchObject({
      userID: "user-2",
      roleIDs: ["role-editor"],
    });

    await act(async () => {
      environment.mock.resolve(removeOperation, {
        data: {
          removeUserRoles: {
            __typename: "RemoveUserRolesPayload",
            user: { __typename: "User", id: "user-2" },
          },
        },
      });
    });

    const refreshOperation = environment.mock.getMostRecentOperation();
    expect(refreshOperation.fragment.node.name).toBe("UsersManagerPaginationQuery");
    expect(refreshOperation.request.variables).toMatchObject({ first: USERS_PAGE_SIZE });

    await act(async () => {
      environment.mock.resolve(refreshOperation, {
        data: buildUsersPayload([
          {
            id: "user-2",
            username: "reviewer",
            email: "reviewer@example.com",
            displayName: "Senior Reviewer",
            bio: "Mentors the review team and ensures standards.",
            updatedAt: "2024-10-12T08:00:00.000Z",
            createdAt: "2024-10-10T08:00:00.000Z",
            roles: [{ id: "role-admin", name: "Administrator" }],
          },
        ], {
          availableRoles: [
            { id: "role-admin", name: "Administrator" },
            { id: "role-editor", name: "Editor" },
            { id: "role-viewer", name: "Viewer" },
          ],
        }),
      });
    });

    await screen.findByText("User profile updated successfully.");
  });

  it("resets a user password when provided in the edit dialog", async () => {
    const environment = renderUsers();
    const initialOperation = environment.mock.getMostRecentOperation();

    await act(async () => {
      environment.mock.resolve(initialOperation, {
        data: buildUsersPayload([
          {
            id: "user-5",
            username: "author",
            email: "author@example.com",
            displayName: "Feature Author",
            bio: "Produces weekly features.",
            updatedAt: "2024-10-10T08:30:00.000Z",
            createdAt: "2024-10-01T12:00:00.000Z",
          },
        ]),
      });
    });

    await userEvent.click(screen.getByRole("button", { name: "Edit user" }));

    await userEvent.type(screen.getByLabelText("Password"), "N3wPassphrase!");
    await userEvent.type(screen.getByLabelText("Confirm password"), "N3wPassphrase!");

    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    const mutationOperation = environment.mock.getMostRecentOperation();
    expect(mutationOperation.fragment.node.name).toBe("UserFormDialogUpdateUserMutation");
    expect(mutationOperation.request.variables.input).toMatchObject({
      id: "user-5",
      password: "N3wPassphrase!",
    });
  });

  it("shows hashing errors when the password cannot be processed", async () => {
    const environment = renderUsers();
    const initialOperation = environment.mock.getMostRecentOperation();

    await act(async () => {
      environment.mock.resolve(initialOperation, { data: buildUsersPayload([]) });
    });

    await userEvent.click(screen.getByRole("button", { name: "New user" }));

    await userEvent.type(screen.getByLabelText("Username"), "ops");
    await userEvent.type(screen.getByLabelText("Email"), "ops@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "   ");
    await userEvent.type(screen.getByLabelText("Confirm password"), "   ");

    await userEvent.click(screen.getByRole("button", { name: "Create user" }));

    const validationAlerts = await screen.findAllByRole("alert");
    expect(validationAlerts.some((element) => element.textContent?.includes("Password is required."))).toBe(true);

    await userEvent.clear(screen.getByLabelText("Password"));
    await userEvent.clear(screen.getByLabelText("Confirm password"));
    await userEvent.type(screen.getByLabelText("Password"), "Reset123!");
    await userEvent.type(screen.getByLabelText("Confirm password"), "Reset123!");

    await userEvent.click(screen.getByRole("button", { name: "Create user" }));

    const mutationOperation = environment.mock.getMostRecentOperation();
    expect(mutationOperation.fragment.node.name).toBe("UserFormDialogCreateUserMutation");

    await act(async () => {
      environment.mock.resolve(mutationOperation, {
        data: {
          createUser: null,
        },
        errors: [{ message: "hash password: bcrypt internal error" }],
      });
    });

    const hashingAlerts = await screen.findAllByRole("alert");
    expect(hashingAlerts.some((element) => element.textContent?.includes("hash password: bcrypt internal error"))).toBe(true);
  });
});
