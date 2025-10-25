import "./posts/posts.css";

import { useMemo, useRef } from "react";
import { graphql, useLazyLoadQuery, useSubscription } from "react-relay";

import type { postsRouteQuery } from "./__generated__/postsRouteQuery.graphql";
import { PostsTable } from "./posts/PostsTable";
import { useToast } from "../providers/ToastProvider";
import {
  applyPostStatusChangeToConnections,
  insertPostIntoConnections,
  isKnownPostStatus,
} from "./posts/postConnectionUtils";
import { postUpdatedSubscription } from "./posts/PostsSubscriptions";
import type { PostsSubscriptionsPostUpdatedSubscription } from "./posts/__generated__/PostsSubscriptionsPostUpdatedSubscription.graphql";
import type { PostStatus } from "./posts/__generated__/PostsTableFragment.graphql";

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

  useSubscription<PostsSubscriptionsPostUpdatedSubscription>(
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
