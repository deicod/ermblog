import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RelayEnvironmentProvider } from "react-relay";
import { createMockEnvironment } from "relay-test-utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { COMMENTS_PAGE_SIZE, CommentsRoute } from "../../comments";
import { NotificationPreferencesProvider } from "../../../providers/NotificationPreferencesProvider";
import { ToastProvider } from "../../../providers/ToastProvider";
import { SessionProvider } from "../../../session/SessionProvider";

function renderComments(environment = createMockEnvironment()) {
  render(
    <RelayEnvironmentProvider environment={environment}>
      <SessionProvider>
        <NotificationPreferencesProvider>
          <ToastProvider>
            <CommentsRoute />
          </ToastProvider>
        </NotificationPreferencesProvider>
      </SessionProvider>
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

function findOperationByName(environment: ReturnType<typeof createMockEnvironment>, name: string) {
  return environment.mock.findOperation(
    (operation) => operation.request.node.params.name === name,
  );
}

describe("CommentsRoute", () => {
  let previousSubscriptionsSetting: string | undefined;

  beforeEach(() => {
    previousSubscriptionsSetting = process.env.VITE_GRAPHQL_SUBSCRIPTIONS_ENABLED;
    process.env.VITE_GRAPHQL_SUBSCRIPTIONS_ENABLED = "true";
  });

  afterEach(() => {
    if (previousSubscriptionsSetting === undefined) {
      delete process.env.VITE_GRAPHQL_SUBSCRIPTIONS_ENABLED;
    } else {
      process.env.VITE_GRAPHQL_SUBSCRIPTIONS_ENABLED = previousSubscriptionsSetting;
    }
  });

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

  it("optimistically updates the comment status when approving from the all filter", async () => {
    const environment = renderComments();
    const initialOperation = environment.mock.getMostRecentOperation();

    await act(async () => {
      environment.mock.resolve(initialOperation, {
        data: buildCommentsPayload([
          {
            id: "comment-1",
            content: "Awaiting review",
            status: "pending",
            authorName: "Jamie",
            submittedAt: "2024-10-12T12:00:00.000Z",
          },
        ]),
      });
    });

    const commentCell = await screen.findByText("Awaiting review");
    const row = commentCell.closest("tr");
    if (!row) {
      throw new Error("Expected comment row to be present");
    }

    const approveButton = within(row).getByRole("button", { name: "Approve" });
    await userEvent.click(approveButton);

    await waitFor(() => {
      expect(
        within(row).getByRole("button", { name: "Mark as spam" }),
      ).toBeDisabled();
    });
    expect(within(row).queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
    expect(within(row).getByText("Approved")).toBeInTheDocument();

    const mutation = environment.mock.getMostRecentOperation();
    expect(mutation.fragment.node.name).toBe("CommentsTableUpdateCommentStatusMutation");
    expect(mutation.request.variables).toEqual({
      input: {
        id: "comment-1",
        status: "approved",
      },
    });

    await act(async () => {
      environment.mock.resolve(mutation, {
        data: {
          updateComment: {
            comment: {
              __typename: "Comment",
              id: "comment-1",
              status: "approved",
            },
          },
        },
      });
    });

    const markSpamButton = within(row).getByRole("button", { name: "Mark as spam" });
    expect(markSpamButton).toBeEnabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("removes comments from the filtered view when their status changes", async () => {
    const environment = renderComments();
    const initialOperation = environment.mock.getMostRecentOperation();

    await act(async () => {
      environment.mock.resolve(initialOperation, {
        data: buildCommentsPayload([
          {
            id: "comment-1",
            content: "Needs review",
            status: "pending",
            authorName: "Alex",
            submittedAt: "2024-10-12T11:00:00.000Z",
          },
        ]),
      });
    });

    const statusSelect = screen.getByLabelText(/Status/i);
    await userEvent.selectOptions(statusSelect, "pending");

    const refetchOperation = environment.mock.getMostRecentOperation();
    await act(async () => {
      environment.mock.resolve(refetchOperation, {
        data: buildCommentsPayload([
          {
            id: "comment-1",
            content: "Needs review",
            status: "pending",
            authorName: "Alex",
            submittedAt: "2024-10-12T11:00:00.000Z",
          },
        ]),
      });
    });

    const commentCell = await screen.findByText("Needs review");
    const row = commentCell.closest("tr");
    if (!row) {
      throw new Error("Expected comment row to be present");
    }

    const approveButton = within(row).getByRole("button", { name: "Approve" });
    await userEvent.click(approveButton);

    const mutation = environment.mock.getMostRecentOperation();
    expect(mutation.fragment.node.name).toBe("CommentsTableUpdateCommentStatusMutation");

    await waitFor(() => {
      expect(screen.queryByText("Needs review")).not.toBeInTheDocument();
    });

    expect(await screen.findByText("No comments match the “pending” status.")).toBeInTheDocument();
    expect(screen.getByText("Total comments: 0")).toBeInTheDocument();

    await act(async () => {
      environment.mock.resolve(mutation, {
        data: {
          updateComment: {
            comment: {
              __typename: "Comment",
              id: "comment-1",
              status: "approved",
            },
          },
        },
      });
    });
  });

  it("restores the previous state and shows an error when the mutation fails", async () => {
    const environment = renderComments();
    const initialOperation = environment.mock.getMostRecentOperation();

    await act(async () => {
      environment.mock.resolve(initialOperation, {
        data: buildCommentsPayload([
          {
            id: "comment-1",
            content: "Needs review",
            status: "pending",
            authorName: "Alex",
            submittedAt: "2024-10-12T11:00:00.000Z",
          },
        ]),
      });
    });

    const statusSelect = screen.getByLabelText(/Status/i);
    await userEvent.selectOptions(statusSelect, "pending");

    const refetchOperation = environment.mock.getMostRecentOperation();
    await act(async () => {
      environment.mock.resolve(refetchOperation, {
        data: buildCommentsPayload([
          {
            id: "comment-1",
            content: "Needs review",
            status: "pending",
            authorName: "Alex",
            submittedAt: "2024-10-12T11:00:00.000Z",
          },
        ]),
      });
    });

    const commentCell = await screen.findByText("Needs review");
    const row = commentCell.closest("tr");
    if (!row) {
      throw new Error("Expected comment row to be present");
    }

    const markSpamButton = within(row).getByRole("button", { name: "Mark as spam" });
    await userEvent.click(markSpamButton);

    const mutation = environment.mock.getMostRecentOperation();

    await act(async () => {
      environment.mock.reject(mutation, new Error("Network error"));
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Failed to update comment status. Network error",
    );
    expect(await screen.findByText("Needs review")).toBeInTheDocument();
    expect(
      within(screen.getByText("Needs review").closest("tr") as HTMLTableRowElement).getByRole(
        "button",
        { name: "Mark as spam" },
      ),
    ).toBeEnabled();
  });

  it("merges new comments from subscriptions and surfaces a toast", async () => {
    const environment = renderComments();
    const initialOperation = environment.mock.getMostRecentOperation();

    await act(async () => {
      environment.mock.resolve(initialOperation, {
        data: buildCommentsPayload([
          {
            id: "comment-1",
            content: "Existing feedback",
            status: "approved",
            authorName: "Morgan",
            submittedAt: "2024-10-12T10:00:00.000Z",
          },
        ]),
      });
    });

    const commentCreatedOperation = findOperationByName(
      environment,
      "CommentsSubscriptionsCommentCreatedSubscription",
    );

    await act(async () => {
      environment.mock.nextValue(commentCreatedOperation, {
        data: {
          commentCreated: {
            __typename: "Comment",
            id: "comment-2",
            content: "New feedback inbound",
            status: "pending",
            authorName: "Taylor",
            submittedAt: "2024-10-12T13:00:00.000Z",
          },
        },
      });
    });

    expect(await screen.findByText("New feedback inbound")).toBeInTheDocument();
    const notifications = screen.getByRole("region", { name: "Notifications" });
    expect(within(notifications).getByText("Taylor says: New feedback inbound")).toBeInTheDocument();
  });

  it("removes comments from the filtered view when a subscription updates the status", async () => {
    const environment = renderComments();
    const initialOperation = environment.mock.getMostRecentOperation();

    await act(async () => {
      environment.mock.resolve(initialOperation, {
        data: buildCommentsPayload([
          {
            id: "comment-1",
            content: "Needs review",
            status: "pending",
            authorName: "Alex",
            submittedAt: "2024-10-12T11:00:00.000Z",
          },
        ]),
      });
    });

    const statusSelect = screen.getByLabelText(/Status/i);
    await userEvent.selectOptions(statusSelect, "pending");

    const refetchOperation = environment.mock.getMostRecentOperation();
    await act(async () => {
      environment.mock.resolve(refetchOperation, {
        data: buildCommentsPayload([
          {
            id: "comment-1",
            content: "Needs review",
            status: "pending",
            authorName: "Alex",
            submittedAt: "2024-10-12T11:00:00.000Z",
          },
        ]),
      });
    });

    expect(await screen.findByText("Needs review")).toBeInTheDocument();

    const commentUpdatedOperation = findOperationByName(
      environment,
      "CommentsSubscriptionsCommentUpdatedSubscription",
    );

    await act(async () => {
      environment.mock.nextValue(commentUpdatedOperation, {
        data: {
          commentUpdated: {
            __typename: "Comment",
            id: "comment-1",
            content: "Needs review",
            status: "approved",
            authorName: "Alex",
            submittedAt: "2024-10-12T11:15:00.000Z",
          },
        },
      });
      environment.mock.complete(commentUpdatedOperation);
    });

    await waitFor(() => {
      expect(screen.queryByText("Needs review")).not.toBeInTheDocument();
    });

    expect(await screen.findByText("No comments match the “pending” status.")).toBeInTheDocument();
    expect(screen.getByText("Total comments: 0")).toBeInTheDocument();

    const notifications = screen.getByRole("region", { name: "Notifications" });
    expect(
      within(notifications).getByText("Alex's comment is now Approved."),
    ).toBeInTheDocument();
    expect(within(notifications).getByText("Comment updated")).toBeInTheDocument();
  });

  it("prunes deleted comments from all connections and surfaces a removal toast", async () => {
    const environment = renderComments();
    const initialOperation = environment.mock.getMostRecentOperation();

    await act(async () => {
      environment.mock.resolve(initialOperation, {
        data: buildCommentsPayload([
          {
            id: "comment-1",
            content: "Marked for deletion",
            status: "pending",
            authorName: "Alex",
            submittedAt: "2024-10-12T11:00:00.000Z",
          },
          {
            id: "comment-2",
            content: "Keep this comment",
            status: "approved",
            authorName: "Jamie",
            submittedAt: "2024-10-12T12:00:00.000Z",
          },
        ]),
      });
    });

    expect(await screen.findByText("Marked for deletion")).toBeInTheDocument();
    expect(screen.getByText("Keep this comment")).toBeInTheDocument();
    expect(screen.getByText("Total comments: 2")).toBeInTheDocument();

    const commentDeletedOperation = findOperationByName(
      environment,
      "CommentsSubscriptionsCommentDeletedSubscription",
    );

    await act(async () => {
      environment.mock.nextValue(commentDeletedOperation, {
        data: { commentDeleted: "comment-1" },
      });
      environment.mock.complete(commentDeletedOperation);
    });

    await waitFor(() => {
      expect(screen.queryByText("Marked for deletion")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Keep this comment")).toBeInTheDocument();
    expect(screen.getByText("Total comments: 1")).toBeInTheDocument();

    const notifications = screen.getByRole("region", { name: "Notifications" });
    expect(within(notifications).getByText("Comment removed")).toBeInTheDocument();
    expect(
      within(notifications).getByText("Removed Alex's comment: Marked for deletion"),
    ).toBeInTheDocument();
  });

});
