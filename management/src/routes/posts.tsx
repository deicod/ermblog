import { graphql, useLazyLoadQuery } from "react-relay";
import type { postsOverviewQuery } from "./__generated__/postsOverviewQuery.graphql";

const postsQuery = graphql`
  query postsOverviewQuery($first: Int = 5) {
    posts(first: $first) {
      totalCount
      edges {
        node {
          id
          title
          status
          updatedAt
        }
      }
    }
  }
`;

export function PostsRoute() {
  const data = useLazyLoadQuery<postsOverviewQuery>(
    postsQuery,
    { first: 5 },
    {
      fetchPolicy: "store-or-network",
    },
  );

  const edges = data.posts?.edges ?? [];

  return (
    <section aria-labelledby="posts-heading">
      <header>
        <h2 id="posts-heading">Posts</h2>
        <p>
          A quick glance at the editorial queue. Upcoming work will enhance this view with
          filters, search, and inline moderation actions.
        </p>
      </header>
      <ol>
        {edges.length === 0 ? (
          <li>No posts available yet. Connect the API to populate this workspace.</li>
        ) : (
          edges.map((edge, index) => (
            <li key={edge?.node?.id ?? `placeholder-${index}`}>
              <strong>{edge?.node?.title ?? "Untitled draft"}</strong>
              {" — "}
              <span>Status: {edge?.node?.status?.toLowerCase() ?? "unknown"}</span>
            </li>
          ))
        )}
      </ol>
      <footer>
        <small>
          Total tracked posts: {data.posts?.totalCount ?? 0}. The Relay wiring keeps this
          module ready for pagination and refetching.
        </small>
      </footer>
    </section>
  );
}

export default PostsRoute;
