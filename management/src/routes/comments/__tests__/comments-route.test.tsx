import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RelayEnvironmentProvider } from "react-relay";
import { createMockEnvironment } from "relay-test-utils";
import { describe, expect, it } from "vitest";

import { COMMENTS_PAGE_SIZE, CommentsRoute } from "../../comments";

function renderComments(environment = createMockEnvironment()) {
  render(
    <RelayEnvironmentProvider environment={environment}>
      <CommentsRoute />
    </RelayEnvironmentProvider>,
  );
  return environment;
}

type CommentNodeInput = {
  id: string;
  content: string;
  status: string;
  authorName?: string | null;
  submittedAt: string;
};

function buildCommentsPayload(
  comments: CommentNodeInput[],
  pageInfo?: { hasNextPage?: boolean; endCursor?: string },
) {
  const edges = comments.map((comment, index) => ({
    cursor: `cursor-${index + 1}`,
    node: {
      __typename: "Comment",
      ...comment,
      authorName: comment.authorName ?? null,
    },
  }));

  return {
    comments: {
      __typename: "CommentConnection",
      totalCount: comments.length,
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

describe("CommentsRoute", () => {
  it("filters comments by status and refetches with updated variables", async () => {
    const environment = renderComments();
    const initialOperation = environment.mock.getMostRecentOperation();
    expect(initialOperation.fragment.node.name).toBe("commentsRouteQuery");

    await act(async () => {
      environment.mock.resolve(initialOperation, {
        data: buildCommentsPayload([
          {
            id: "comment-1",
            content: "First comment",
            status: "approved",
            authorName: "Alex",
            submittedAt: "2024-10-12T11:00:00.000Z",
          },
          {
            id: "comment-2",
            content: "Needs review",
            status: "pending",
            authorName: "Jamie",
            submittedAt: "2024-10-12T12:00:00.000Z",
          },
        ]),
      });
    });

    const list = await screen.findByRole("table");
    expect(within(list).getByText("First comment")).toBeInTheDocument();
    expect(within(list).getByText("Needs review")).toBeInTheDocument();

    const statusSelect = screen.getByLabelText(/Status/i);
    await userEvent.selectOptions(statusSelect, "pending");

    const refetchOperation = environment.mock.getMostRecentOperation();
    expect(refetchOperation.fragment.node.name).toBe("CommentsTablePaginationQuery");
    expect(refetchOperation.request.variables.status).toBe("pending");
    expect(refetchOperation.request.variables.first).toBe(COMMENTS_PAGE_SIZE);

    await act(async () => {
      environment.mock.resolve(refetchOperation, {
        data: buildCommentsPayload([
          {
            id: "comment-2",
            content: "Needs review",
            status: "pending",
            authorName: "Jamie",
            submittedAt: "2024-10-12T12:00:00.000Z",
          },
        ]),
      });
    });

    expect(screen.getByText("Needs review")).toBeInTheDocument();
    expect(screen.queryByText("First comment")).not.toBeInTheDocument();
  });

  it("renders an empty state when no comments are returned", async () => {
    const environment = renderComments();
    const initialOperation = environment.mock.getMostRecentOperation();

    await act(async () => {
      environment.mock.resolve(initialOperation, {
        data: buildCommentsPayload([]),
      });
    });

    const emptyState = await screen.findByText(
      "No comments are available yet. Connect the API or collect feedback to populate this list.",
    );
    expect(emptyState).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Load more" })).toBeDisabled();
  });
});
