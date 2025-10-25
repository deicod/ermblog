import "./comments/comments.css";

import { useMemo } from "react";
import { graphql, useLazyLoadQuery, useSubscription } from "react-relay";

import type { commentsRouteQuery } from "./__generated__/commentsRouteQuery.graphql";
import { CommentsTable } from "./comments/CommentsTable";
import {
  applyCommentStatusChangeToConnections,
  insertCommentIntoConnections,
  isKnownCommentStatus,
} from "./comments/commentConnectionUtils";
import { useToast } from "../providers/ToastProvider";
import { commentCreatedSubscription, commentUpdatedSubscription } from "./comments/CommentsSubscriptions";
import type { CommentsSubscriptionsCommentCreatedSubscription } from "./comments/__generated__/CommentsSubscriptionsCommentCreatedSubscription.graphql";
import type { CommentsSubscriptionsCommentUpdatedSubscription } from "./comments/__generated__/CommentsSubscriptionsCommentUpdatedSubscription.graphql";
import type { CommentStatus } from "./comments/__generated__/CommentsTableFragment.graphql";

export const COMMENTS_PAGE_SIZE = 20;

const commentsRouteQueryDocument = graphql`
  query commentsRouteQuery($first: Int = 20, $status: CommentStatus) {
    ...CommentsTableFragment @arguments(first: $first, status: $status)
  }
`;

export function CommentsRoute() {
  const data = useLazyLoadQuery<commentsRouteQuery>(
    commentsRouteQueryDocument,
    { first: COMMENTS_PAGE_SIZE },
    { fetchPolicy: "store-or-network" },
  );
  const { showToast } = useToast();

  useSubscription<CommentsSubscriptionsCommentCreatedSubscription>(
    useMemo(() => ({
      subscription: commentCreatedSubscription,
      variables: {},
      updater: (store) => {
        const comment = store.getRootField("commentCreated");
        if (!comment) {
          return;
        }
        const commentIdValue = comment.getValue("id");
        if (typeof commentIdValue !== "string") {
          return;
        }
        const commentId = commentIdValue;
        let record = store.get(commentId);
        if (!record) {
          record = store.create(commentId, comment.getType());
        }
        record.copyFieldsFrom(comment);
        const statusFromPayload = comment.getValue("status") as CommentStatus | null;
        const status = isKnownCommentStatus(statusFromPayload) ? statusFromPayload : null;
        record.setValue(status, "status");
        insertCommentIntoConnections({
          store,
          commentRecord: record,
          status,
        });
      },
      onNext: (response) => {
        const comment = response?.commentCreated;
        if (!comment) {
          return;
        }
        const authorLabel = comment.authorName?.trim() || "Anonymous";
        const snippet = comment.content?.trim();
        const truncated = snippet && snippet.length > 80 ? `${snippet.slice(0, 77)}…` : snippet;
        const message = truncated
          ? `${authorLabel} says: ${truncated}`
          : `New comment from ${authorLabel}.`;
        showToast({ title: "New comment", message });
      },
    }), [showToast]),
  );

  useSubscription<CommentsSubscriptionsCommentUpdatedSubscription>(
    useMemo(() => ({
      subscription: commentUpdatedSubscription,
      variables: {},
      updater: (store) => {
        const comment = store.getRootField("commentUpdated");
        if (!comment) {
          return;
        }
        const commentIdValue = comment.getValue("id");
        if (typeof commentIdValue !== "string") {
          return;
        }
        const commentId = commentIdValue;
        const existing = store.get(commentId);
        const nextValueFromPayload = comment.getValue("status") as CommentStatus | null;
        const nextStatus = isKnownCommentStatus(nextValueFromPayload) ? nextValueFromPayload : null;
        const record = existing ?? store.create(commentId, comment.getType());
        record.copyFieldsFrom(comment);
        record.setValue(nextStatus, "status");

        applyCommentStatusChangeToConnections({
          store,
          commentId,
          nextStatus,
        });
      },
      onNext: (response) => {
        const comment = response?.commentUpdated;
        if (!comment) {
          return;
        }
        const authorLabel = comment.authorName?.trim() || "Anonymous";
        const statusLabel = comment.status
          ? comment.status.charAt(0).toUpperCase() + comment.status.slice(1)
          : "updated";
        showToast({
          title: "Comment updated",
          message:
            comment.status != null
              ? `${authorLabel}'s comment is now ${statusLabel}.`
              : `${authorLabel}'s comment was updated.`,
          intent: comment.status === "approved" ? "success" : "info",
        });
      },
    }), [showToast]),
  );

  return (
    <section aria-labelledby="comments-heading" className="comments-route">
      <header className="comments-route__header">
        <h2 id="comments-heading">Comments</h2>
        <p>
          Review audience feedback, moderate conversations with contextual status chips, and load
          additional entries as needed. Use the status filter to focus on pending review, spam, or
          trashed items.
        </p>
      </header>
      <CommentsTable queryRef={data} pageSize={COMMENTS_PAGE_SIZE} />
    </section>
  );
}

export default CommentsRoute;
