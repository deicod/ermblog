import "./posts/posts.css";

import { graphql, useLazyLoadQuery } from "react-relay";

import type { postsRouteQuery } from "./__generated__/postsRouteQuery.graphql";
import { PostsTable } from "./posts/PostsTable";

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
