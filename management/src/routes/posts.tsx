import "./posts/posts.css";

import { useMemo, useRef } from "react";
import { graphql, useLazyLoadQuery } from "react-relay";

import type { postsRouteQuery } from "./__generated__/postsRouteQuery.graphql";
import { PostsTable } from "./posts/PostsTable";
import { useToast } from "../providers/ToastProvider";
import {
  applyPostStatusChangeToConnections,
  insertPostIntoConnections,
  isKnownPostStatus,
  removePostFromConnections,
} from "./posts/postConnectionUtils";
import {
  getPostCreatedRecord,
  getPostDeletedId,
  postCreatedSubscription,
  postDeletedSubscription,
  postUpdatedSubscription,
} from "./posts/PostsSubscriptions";
import { useNotificationSubscription } from "./hooks/useNotificationSubscription";
import type { NotificationCategory } from "../providers/NotificationPreferencesProvider";
import type { PostsSubscriptionsPostUpdatedSubscription } from "./posts/__generated__/PostsSubscriptionsPostUpdatedSubscription.graphql";
import type { PostsSubscriptionsPostCreatedSubscription } from "./posts/__generated__/PostsSubscriptionsPostCreatedSubscription.graphql";
import type { PostsSubscriptionsPostDeletedSubscription } from "./posts/__generated__/PostsSubscriptionsPostDeletedSubscription.graphql";
import type { PostStatus } from "./posts/__generated__/PostsTableFragment.graphql";

const POST_CREATED_CATEGORY: NotificationCategory = "POST_CREATED";
const POST_UPDATED_CATEGORY: NotificationCategory = "POST_UPDATED";
const POST_DELETED_CATEGORY: NotificationCategory = "POST_DELETED";

export const POSTS_PAGE_SIZE = 10;

const postsRouteQueryDocument = graphql`
  query postsRouteQuery($first: Int = 10, $status: PostStatus) {
    ...PostsTableFragment @arguments(first: $first, status: $status)
  }
`;

export function PostsRoute() {
  const data = useLazyLoadQuery<postsRouteQuery>(
    postsRouteQueryDocument,
    { first: POSTS_PAGE_SIZE },
    {
      fetchPolicy: "store-or-network",
    },
  );
  const { showToast } = useToast();
  const latestPostStatusRef = useRef<PostStatus | null>(null);
  const latestDeletedPostTitleRef = useRef<string | null>(null);

  useNotificationSubscription<PostsSubscriptionsPostCreatedSubscription>(
    POST_CREATED_CATEGORY,
    useMemo(
      () => ({
        subscription: postCreatedSubscription,
        variables: {},
        updater: (store) => {
          const post = getPostCreatedRecord(store);
          if (!post) {
            return;
          }
          const postIdValue = post.getValue("id");
          if (typeof postIdValue !== "string") {
            return;
          }
          const postId = postIdValue;
          const statusValue = post.getValue("status") as PostStatus | null;
          const status = isKnownPostStatus(statusValue) ? statusValue : null;
          const record = store.get(postId) ?? store.create(postId, post.getType());
          record.copyFieldsFrom(post);
          record.setValue(status, "status");

          insertPostIntoConnections({
            store,
            postRecord: record,
            status,
          });
        },
        onNext: (response) => {
          const post = response?.postCreated;
          if (!post) {
            return;
          }
          const title = post.title?.trim() || "Untitled draft";
          const statusFromResponse = (post.status as PostStatus | null | undefined) ?? null;
          const statusLabel =
            statusFromResponse != null
              ? statusFromResponse.charAt(0).toUpperCase() + statusFromResponse.slice(1)
              : null;
          showToast({
            title: "Post created",
            message:
              statusLabel != null
                ? `“${title}” was created as ${statusLabel}.`
                : `“${title}” was created.`,
            intent: statusFromResponse === "published" ? "success" : "info",
            category: POST_CREATED_CATEGORY,
          });
        },
      }),
      [showToast],
    ),
  );

  useNotificationSubscription<PostsSubscriptionsPostDeletedSubscription>(
    POST_DELETED_CATEGORY,
    useMemo(
      () => ({
        subscription: postDeletedSubscription,
        variables: {},
        updater: (store, data) => {
          const responseId = data?.postDeleted;
          const postId =
            typeof responseId === "string" && responseId.trim().length > 0
              ? responseId
              : getPostDeletedId(store);
          if (!postId) {
            latestDeletedPostTitleRef.current = null;
            return;
          }
          const existing = store.get(postId);
          const titleValue = existing?.getValue("title");
          latestDeletedPostTitleRef.current =
            typeof titleValue === "string" && titleValue.trim().length > 0 ? titleValue : null;

          removePostFromConnections({
            store,
            postId,
          });
          store.delete(postId);
        },
        onNext: () => {
          const title = latestDeletedPostTitleRef.current?.trim();
          showToast({
            title: "Post deleted",
            message: title ? `“${title}” was deleted.` : "A post was deleted.",
            intent: "warning",
            category: POST_DELETED_CATEGORY,
          });
          latestDeletedPostTitleRef.current = null;
        },
      }),
      [showToast],
    ),
  );

  useNotificationSubscription<PostsSubscriptionsPostUpdatedSubscription>(
    POST_UPDATED_CATEGORY,
    useMemo(() => ({
      subscription: postUpdatedSubscription,
      variables: {},
      updater: (store) => {
        const post = store.getRootField("postUpdated");
        if (!post) {
          return;
        }
        const postIdValue = post.getValue("id");
        if (typeof postIdValue !== "string") {
          return;
        }
        const postId = postIdValue;
        const existing = store.get(postId);
        const nextValue = post.getValue("status") as PostStatus | null;
        const nextStatus = isKnownPostStatus(nextValue) ? nextValue : null;
        const record = existing ?? store.create(postId, post.getType());
        record.copyFieldsFrom(post);
        record.setValue(nextStatus, "status");
        latestPostStatusRef.current = nextStatus;

        applyPostStatusChangeToConnections({
          store,
          postId,
          nextStatus,
        });
      },
      onNext: (response) => {
        const post = response?.postUpdated;
        if (!post) {
          return;
        }
        const statusFromResponse = (post.status as PostStatus | null | undefined) ?? null;
        const statusForToast = statusFromResponse ?? latestPostStatusRef.current;
        const statusLabel = statusForToast
          ? statusForToast.charAt(0).toUpperCase() + statusForToast.slice(1)
          : "updated";
        const title = post.title?.trim() || "Untitled draft";
        showToast({
          title: "Post updated",
          message:
            statusForToast != null
              ? `“${title}” is now ${statusLabel}.`
              : `“${title}” was updated.`,
          intent: statusForToast === "published" ? "success" : "info",
          category: POST_UPDATED_CATEGORY,
        });
      },
    }), [showToast]),
  );

  return (
    <section aria-labelledby="posts-heading" className="posts-route">
      <header className="posts-route__header">
        <h2 id="posts-heading">Posts</h2>
        <p>
          Monitor the editorial pipeline, filter by publication status, and load additional
          entries as needed. Future iterations will introduce search and inline moderation tools.
        </p>
      </header>
      <PostsTable queryRef={data} pageSize={POSTS_PAGE_SIZE} />
    </section>
  );
}

export default PostsRoute;
