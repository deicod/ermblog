import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RelayEnvironmentProvider } from "react-relay";
import { MemoryRouter } from "react-router-dom";
import { createMockEnvironment } from "relay-test-utils";
import { describe, expect, it } from "vitest";

import { POSTS_PAGE_SIZE, PostsRoute } from "../../posts";
import { ToastProvider } from "../../../providers/ToastProvider";

function renderPosts(environment = createMockEnvironment()) {
  render(
    <RelayEnvironmentProvider environment={environment}>
      <ToastProvider>
        <MemoryRouter>
          <PostsRoute />
        </MemoryRouter>
      </ToastProvider>
    </RelayEnvironmentProvider>,
  );
  return environment;
}

type PostNodeInput = {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
  authorID?: string | null;
  author?:
    | {
        id: string;
        displayName?: string | null;
        email?: string | null;
        username?: string | null;
      }
    | null;
};

type BuildPostsPayloadOptions = {
  pageInfo?: { hasNextPage?: boolean; endCursor?: string };
  totalCount?: number;
};

function buildPostsPayload(posts: PostNodeInput[], options?: BuildPostsPayloadOptions) {
  const edges = posts.map((post, index) => ({
    cursor: `cursor-${index + 1}`,
    node: {
      __typename: "Post",
      ...post,
      authorID: post.authorID ?? null,
      author: post.author
        ? {
            __typename: "User",
            id: post.author.id,
            displayName: post.author.displayName ?? null,
            email: post.author.email ?? null,
            username: post.author.username ?? null,
          }
        : null,
    },
  }));

  return {
    posts: {
      __typename: "PostConnection",
      totalCount: options?.totalCount ?? posts.length,
      edges,
      pageInfo: {
        __typename: "PageInfo",
        hasNextPage: options?.pageInfo?.hasNextPage ?? false,
        hasPreviousPage: false,
        startCursor: edges[0]?.cursor ?? null,
        endCursor:
          options?.pageInfo?.endCursor ?? edges[edges.length - 1]?.cursor ?? null,
      },
    },
  };
}

function findOperationByName(environment: ReturnType<typeof createMockEnvironment>, name: string) {
  return environment.mock.findOperation(
    (operation) => operation.request.node.params.name === name,
  );
}

describe("PostsRoute", () => {
  it("filters posts by status and refetches with the selected variables", async () => {
    const environment = renderPosts();
    const initialOperation = environment.mock.getMostRecentOperation();
    expect(initialOperation.fragment.node.name).toBe("postsRouteQuery");

    await act(async () => {
      environment.mock.resolve(initialOperation, {
        data: buildPostsPayload([
          {
            id: "post-1",
            title: "Editorial draft",
            status: "draft",
            updatedAt: "2024-10-10T10:00:00.000Z",
            authorID: "author-1",
            author: {
              id: "author-1",
              displayName: "Editor Extraordinaire",
              email: "editor@example.com",
              username: "editor",
            },
          },
          {
            id: "post-2",
            title: "Breaking news",
            status: "published",
            updatedAt: "2024-10-11T09:00:00.000Z",
            authorID: "author-2",
            author: {
              id: "author-2",
              displayName: null,
              email: "reporter@example.com",
              username: "reporter",
            },
          },
        ]),
      });
    });

    const table = await screen.findByRole("table");
    expect(within(table).getByRole("link", { name: "Editorial draft" })).toBeInTheDocument();
    expect(within(table).getByText("Editor Extraordinaire")).toBeInTheDocument();
    expect(within(table).getByRole("link", { name: "Breaking news" })).toBeInTheDocument();
    expect(within(table).getByText("reporter@example.com")).toBeInTheDocument();

    const statusSelect = screen.getByLabelText("Status");
    await userEvent.selectOptions(statusSelect, "draft");

    const refetchOperation = environment.mock.getMostRecentOperation();
    expect(refetchOperation.fragment.node.name).toBe("PostsTablePaginationQuery");
    expect(refetchOperation.request.variables.status).toBe("draft");
    expect(refetchOperation.request.variables.first).toBe(POSTS_PAGE_SIZE);

    await act(async () => {
      environment.mock.resolve(refetchOperation, {
        data: buildPostsPayload([
          {
            id: "post-1",
            title: "Editorial draft",
            status: "draft",
            updatedAt: "2024-10-10T10:00:00.000Z",
            authorID: "author-1",
            author: {
              id: "author-1",
              displayName: "Editor Extraordinaire",
              email: "editor@example.com",
              username: "editor",
            },
          },
        ]),
      });
    });

    expect(screen.getByRole("link", { name: "Editorial draft" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Breaking news" })).not.toBeInTheDocument();
  });

  it("renders an empty state when no posts are returned", async () => {
    const environment = renderPosts();
    const initialOperation = environment.mock.getMostRecentOperation();
    await act(async () => {
      environment.mock.resolve(initialOperation, {
        data: buildPostsPayload([]),
      });
    });

    const emptyMessage = await screen.findByText(
      "No posts are available yet. Connect the API or create a post to populate this list.",
    );
    expect(emptyMessage).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Load more" })).toBeDisabled();
  });

  it("paginates additional posts when requesting more", async () => {
    const environment = renderPosts();
    const initialOperation = environment.mock.getMostRecentOperation();
    await act(async () => {
      environment.mock.resolve(initialOperation, {
        data: {
          posts: {
            __typename: "PostConnection",
            totalCount: 2,
            edges: [
              {
                cursor: "cursor-1",
                node: {
                  __typename: "Post",
                  id: "post-1",
                  title: "First story",
                  status: "draft",
                  updatedAt: "2024-10-10T10:00:00.000Z",
                  authorID: "author-1",
                  author: {
                    id: "author-1",
                    displayName: null,
                    email: null,
                    username: "storysmith",
                  },
                },
              },
              {
                cursor: "cursor-2",
                node: {
                  __typename: "Post",
                  id: "post-2",
                  title: "Second story",
                  status: "pending",
                  updatedAt: "2024-10-10T11:00:00.000Z",
                  authorID: "author-2",
                  author: {
                    id: "author-2",
                    displayName: null,
                    email: null,
                    username: null,
                  },
                },
              },
            ],
            pageInfo: {
              __typename: "PageInfo",
              hasNextPage: true,
              hasPreviousPage: false,
              startCursor: "cursor-1",
              endCursor: "cursor-2",
            },
          },
        },
      });
    });

    const loadMoreButton = await screen.findByRole("button", { name: "Load more" });
    expect(loadMoreButton).toBeEnabled();
    expect(screen.getByText("storysmith")).toBeInTheDocument();
    expect(screen.getByText("author-2")).toBeInTheDocument();

    await userEvent.click(loadMoreButton);

    const paginationOperation = environment.mock.getMostRecentOperation();
    expect(paginationOperation.fragment.node.name).toBe("PostsTablePaginationQuery");
    expect(paginationOperation.request.variables.after).toBe("cursor-2");
    expect(paginationOperation.request.variables.first).toBe(POSTS_PAGE_SIZE);

    await act(async () => {
      environment.mock.resolve(paginationOperation, {
        data: {
          posts: {
            __typename: "PostConnection",
            totalCount: 3,
            edges: [
              {
                cursor: "cursor-3",
                node: {
                  __typename: "Post",
                  id: "post-3",
                  title: "Third story",
                  status: "published",
                  updatedAt: "2024-10-10T12:00:00.000Z",
                  authorID: null,
                  author: null,
                },
              },
            ],
            pageInfo: {
              __typename: "PageInfo",
              hasNextPage: false,
              hasPreviousPage: true,
              startCursor: "cursor-3",
              endCursor: "cursor-3",
            },
          },
        },
      });
    });

    expect(await screen.findByRole("link", { name: "Third story" })).toBeInTheDocument();
    expect(screen.getByText("Unknown author")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Load more" })).toBeDisabled();
  });

  it("inserts posts via the postCreated subscription and updates totals", async () => {
    const environment = renderPosts();
    const initialOperation = environment.mock.getMostRecentOperation();

    await act(async () => {
      environment.mock.resolve(initialOperation, {
        data: buildPostsPayload([
          {
            id: "post-1",
            title: "Existing draft",
            status: "draft",
            updatedAt: "2024-10-10T10:00:00.000Z",
            authorID: "author-1",
            author: {
              id: "author-1",
              displayName: "Editor",
              email: "editor@example.com",
              username: "editor",
            },
          },
        ]),
      });
    });

    expect(await screen.findByText("Total posts: 1")).toBeInTheDocument();

    const postCreatedOperation = findOperationByName(
      environment,
      "PostsSubscriptionsPostCreatedSubscription",
    );

    await act(async () => {
      environment.mock.nextValue(postCreatedOperation, {
        data: {
          postCreated: {
            __typename: "Post",
            id: "post-2",
            title: "Fresh headline",
            status: "published",
            updatedAt: "2024-10-11T08:30:00.000Z",
            authorID: "author-2",
            author: {
              __typename: "User",
              id: "author-2",
              displayName: "Reporter",
              email: "reporter@example.com",
              username: "reporter",
            },
          },
        },
      });
      environment.mock.complete(postCreatedOperation);
    });

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Fresh headline" })).toBeInTheDocument();
      expect(screen.getByText("Reporter")).toBeInTheDocument();
      expect(screen.getByText("Total posts: 2")).toBeInTheDocument();
    });

    const notifications = screen.getByRole("region", { name: "Notifications" });
    expect(
      within(notifications).getByText("“Fresh headline” was created as Published."),
    ).toBeInTheDocument();
    expect(within(notifications).getByText("Post created")).toBeInTheDocument();
  });

  it("removes posts via the postDeleted subscription and updates totals", async () => {
    const environment = renderPosts();
    const initialOperation = environment.mock.getMostRecentOperation();

    await act(async () => {
      environment.mock.resolve(initialOperation, {
        data: buildPostsPayload([
          {
            id: "post-1",
            title: "Stay or go",
            status: "draft",
            updatedAt: "2024-10-10T10:00:00.000Z",
            authorID: "author-1",
            author: {
              id: "author-1",
              displayName: "Editor",
              email: "editor@example.com",
              username: "editor",
            },
          },
          {
            id: "post-2",
            title: "To be removed",
            status: "pending",
            updatedAt: "2024-10-11T08:30:00.000Z",
            authorID: "author-2",
            author: {
              id: "author-2",
              displayName: "Reporter",
              email: "reporter@example.com",
              username: "reporter",
            },
          },
        ]),
      });
    });

    expect(await screen.findByText("Total posts: 2")).toBeInTheDocument();

    const postDeletedOperation = findOperationByName(
      environment,
      "PostsSubscriptionsPostDeletedSubscription",
    );

    await act(async () => {
      environment.mock.nextValue(postDeletedOperation, {
        data: {
          postDeleted: "post-2",
        },
      });
      environment.mock.complete(postDeletedOperation);
    });

    await waitFor(() => {
      expect(screen.queryByRole("link", { name: "To be removed" })).not.toBeInTheDocument();
      expect(screen.getByText("Total posts: 1")).toBeInTheDocument();
    });

    const notifications = screen.getByRole("region", { name: "Notifications" });
    expect(within(notifications).getByText("“To be removed” was deleted.")).toBeInTheDocument();
    expect(within(notifications).getByText("Post deleted")).toBeInTheDocument();
  });

  it("decrements the total when removing a post that is not in the loaded edges", async () => {
    const environment = renderPosts();
    const initialOperation = environment.mock.getMostRecentOperation();

    await act(async () => {
      environment.mock.resolve(initialOperation, {
        data: buildPostsPayload(
          [
            {
              id: "post-1",
              title: "Visible post",
              status: "draft",
              updatedAt: "2024-10-11T09:00:00.000Z",
              authorID: "author-1",
              author: {
                id: "author-1",
                displayName: "Reporter",
                email: "reporter@example.com",
                username: "reporter",
              },
            },
          ],
          { pageInfo: { hasNextPage: true, endCursor: "cursor-1" }, totalCount: 5 },
        ),
      });
    });

    expect(await screen.findByText("Total posts: 5")).toBeInTheDocument();

    const postDeletedOperation = findOperationByName(
      environment,
      "PostsSubscriptionsPostDeletedSubscription",
    );

    await act(async () => {
      environment.mock.nextValue(postDeletedOperation, {
        data: {
          postDeleted: "post-5",
        },
      });
      environment.mock.complete(postDeletedOperation);
    });

    await waitFor(() => {
      expect(screen.getByText("Total posts: 4")).toBeInTheDocument();
    });
  });

  it("updates posts in response to the postUpdated subscription and renders a toast", async () => {
    const environment = renderPosts();
    const initialOperation = environment.mock.getMostRecentOperation();

    await act(async () => {
      environment.mock.resolve(initialOperation, {
        data: buildPostsPayload([
          {
            id: "post-1",
            title: "Breaking news",
            status: "draft",
            updatedAt: "2024-10-11T09:00:00.000Z",
            authorID: "author-1",
            author: {
              id: "author-1",
              displayName: "Reporter",
              email: "reporter@example.com",
              username: "reporter",
            },
          },
        ]),
      });
    });

    const postUpdatedOperation = findOperationByName(
      environment,
      "PostsSubscriptionsPostUpdatedSubscription",
    );

    await act(async () => {
      environment.mock.nextValue(postUpdatedOperation, {
        data: {
          postUpdated: {
            __typename: "Post",
            id: "post-1",
            title: "Breaking news",
            status: "published",
            updatedAt: "2024-10-11T10:15:00.000Z",
            authorID: "author-1",
            author: {
              __typename: "User",
              id: "author-1",
              displayName: "Reporter",
              email: "reporter@example.com",
              username: "reporter",
            },
          },
        },
      });
      environment.mock.complete(postUpdatedOperation);
    });

    await waitFor(() => {
      const link = screen.getByRole("link", { name: "Breaking news" });
      const row = link.closest("tr");
      if (!row) {
        throw new Error("Expected to find the post row");
      }
      expect(within(row).getByText("Published")).toBeInTheDocument();
    });

    const notifications = screen.getByRole("region", { name: "Notifications" });
    expect(within(notifications).getByText("“Breaking news” is now Published.")).toBeInTheDocument();
  });

  it("removes posts from the filtered view when a subscription updates the status", async () => {
    const environment = renderPosts();
    const initialOperation = environment.mock.getMostRecentOperation();

    await act(async () => {
      environment.mock.resolve(initialOperation, {
        data: buildPostsPayload([
          {
            id: "post-1",
            title: "Breaking news",
            status: "draft",
            updatedAt: "2024-10-11T09:00:00.000Z",
            authorID: "author-1",
            author: {
              id: "author-1",
              displayName: "Reporter",
              email: "reporter@example.com",
              username: "reporter",
            },
          },
        ]),
      });
    });

    const statusSelect = screen.getByLabelText("Status");
    await userEvent.selectOptions(statusSelect, "draft");

    const refetchOperation = environment.mock.getMostRecentOperation();
    await act(async () => {
      environment.mock.resolve(refetchOperation, {
        data: buildPostsPayload([
          {
            id: "post-1",
            title: "Breaking news",
            status: "draft",
            updatedAt: "2024-10-11T09:00:00.000Z",
            authorID: "author-1",
            author: {
              id: "author-1",
              displayName: "Reporter",
              email: "reporter@example.com",
              username: "reporter",
            },
          },
        ]),
      });
    });

    expect(await screen.findByRole("link", { name: "Breaking news" })).toBeInTheDocument();

    const postUpdatedOperation = findOperationByName(
      environment,
      "PostsSubscriptionsPostUpdatedSubscription",
    );

    await act(async () => {
      environment.mock.nextValue(postUpdatedOperation, {
        data: {
          postUpdated: {
            __typename: "Post",
            id: "post-1",
            title: "Breaking news",
            status: "published",
            updatedAt: "2024-10-11T10:15:00.000Z",
            authorID: "author-1",
            author: {
              __typename: "User",
              id: "author-1",
              displayName: "Reporter",
              email: "reporter@example.com",
              username: "reporter",
            },
          },
        },
      });
      environment.mock.complete(postUpdatedOperation);
    });

    await waitFor(() => {
      expect(screen.queryByRole("link", { name: "Breaking news" })).not.toBeInTheDocument();
    });

    expect(await screen.findByText("No posts match the “draft” status.")).toBeInTheDocument();
    expect(screen.getByText("Total posts: 0")).toBeInTheDocument();

    const notifications = screen.getByRole("region", { name: "Notifications" });
    expect(within(notifications).getByText("“Breaking news” is now Published.")).toBeInTheDocument();
    expect(within(notifications).getByText("Post updated")).toBeInTheDocument();
  });
});
