import { Suspense } from "react";
import { graphql, useLazyLoadQuery } from "react-relay";
import { Link, Navigate, useParams } from "react-router-dom";

import type { PostEditorRouteQuery } from "./__generated__/PostEditorRouteQuery.graphql";
import { PostEditor } from "./editor/PostEditor";

type CategoryNode = NonNullable<
  NonNullable<PostEditorRouteQuery["response"]["categories"]>["edges"][number]
>["node"];

type TagNode = NonNullable<
  NonNullable<PostEditorRouteQuery["response"]["tags"]>["edges"][number]
>["node"];

type MediaNode = NonNullable<
  NonNullable<PostEditorRouteQuery["response"]["medias"]>["edges"][number]
>["node"];

const postEditorRouteQuery = graphql`
  query PostEditorRouteQuery($postId: ID!) {
    post(id: $postId) {
      id
      title
      slug
      status
      type
      excerpt
      content
      seo
      publishedAt
      featuredMediaID
      featuredMedia {
        id
        title
        url
      }
      categories {
        id
        name
      }
      tags {
        id
        name
      }
    }
    categories(first: 100) {
      edges {
        node {
          id
          name
        }
      }
    }
    tags(first: 100) {
      edges {
        node {
          id
          name
        }
      }
    }
    medias(first: 100) {
      edges {
        node {
          id
          title
          url
        }
      }
    }
  }
`;

function extractNodes<T>(connection: { edges?: Array<{ node?: T | null } | null> } | null | undefined): T[] {
  if (!connection?.edges) {
    return [];
  }
  const nodes: T[] = [];
  for (const edge of connection.edges) {
    if (edge?.node) {
      nodes.push(edge.node);
    }
  }
  return nodes;
}

function PostEditorContent({ postId }: { postId: string }) {
  const data = useLazyLoadQuery<PostEditorRouteQuery>(
    postEditorRouteQuery,
    { postId },
    { fetchPolicy: "store-or-network" },
  );

  if (!data.post) {
    return (
      <section className="post-editor-route post-editor-route--empty">
        <div className="post-editor-route__header">
          <h2>Post not found</h2>
          <p>The requested post could not be located. It may have been deleted.</p>
          <Link to="/posts" className="post-editor-route__back-link">
            Return to posts
          </Link>
        </div>
      </section>
    );
  }

  const categoryNodes: CategoryNode[] = extractNodes<CategoryNode>(data.categories);
  const tagNodes: TagNode[] = extractNodes<TagNode>(data.tags);
  const mediaNodes: MediaNode[] = extractNodes<MediaNode>(data.medias);

  return (
    <section className="post-editor-route" aria-labelledby="post-editor-route-heading">
      <header className="post-editor-route__header">
        <div>
          <h2 id="post-editor-route-heading">Edit post</h2>
          <p>
            Update the article details, manage scheduling, and refresh the SEO metadata before
            publishing.
          </p>
        </div>
        <Link to="/posts" className="post-editor-route__back-link">
          ← Back to posts
        </Link>
      </header>
      <PostEditor post={data.post} categories={categoryNodes} tags={tagNodes} media={mediaNodes} />
    </section>
  );
}

export function PostEditorRoute() {
  const params = useParams<{ postId: string }>();
  const postId = params.postId;

  if (!postId) {
    return <Navigate to="/posts" replace />;
  }

  return (
    <Suspense fallback={<div className="post-editor-route__loading">Loading post…</div>}>
      <PostEditorContent postId={postId} />
    </Suspense>
  );
}

export default PostEditorRoute;
