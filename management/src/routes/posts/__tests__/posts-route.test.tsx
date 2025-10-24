import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RelayEnvironmentProvider } from "react-relay";
import { createMockEnvironment } from "relay-test-utils";
import { describe, expect, it } from "vitest";

import { POSTS_PAGE_SIZE, PostsRoute } from "../../posts";

function renderPosts(environment = createMockEnvironment()) {
  render(
    <RelayEnvironmentProvider environment={environment}>
      <PostsRoute />
    </RelayEnvironmentProvider>,
  );
  return environment;
}

type PostNodeInput = {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
  authorID: string;
};

function buildPostsPayload(posts: PostNodeInput[], pageInfo?: { hasNextPage?: boolean; endCursor?: string }) {
  const edges = posts.map((post, index) => ({
    cursor: `cursor-${index + 1}`,
    node: {
      __typename: "Post",
      ...post,
    },
  }));

  return {
    posts: {
      __typename: "PostConnection",
      totalCount: posts.length,
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
          },
          {
            id: "post-2",
            title: "Breaking news",
            status: "published",
            updatedAt: "2024-10-11T09:00:00.000Z",
            authorID: "author-2",
          },
        ]),
      });
    });

    const table = await screen.findByRole("table");
    expect(within(table).getByText("Editorial draft")).toBeInTheDocument();
    expect(within(table).getByText("Breaking news")).toBeInTheDocument();

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
          },
        ]),
      });
    });

    expect(screen.getByText("Editorial draft")).toBeInTheDocument();
    expect(screen.queryByText("Breaking news")).not.toBeInTheDocument();
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
                  authorID: "author-3",
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

    expect(await screen.findByText("Third story")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Load more" })).toBeDisabled();
  });
});
