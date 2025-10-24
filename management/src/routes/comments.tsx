import "./comments/comments.css";

import { graphql, useLazyLoadQuery } from "react-relay";

import type { commentsRouteQuery } from "./__generated__/commentsRouteQuery.graphql";
import { CommentsTable } from "./comments/CommentsTable";

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
