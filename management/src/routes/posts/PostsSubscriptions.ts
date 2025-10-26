import { graphql } from "react-relay";
import type { RecordSourceSelectorProxy } from "relay-runtime";

export const postUpdatedSubscription = graphql`
  subscription PostsSubscriptionsPostUpdatedSubscription {
    postUpdated {
      id
      title
      status
      updatedAt
      authorID
      author {
        id
        displayName
        email
        username
      }
    }
  }
`;

export const postCreatedSubscription = graphql`
  subscription PostsSubscriptionsPostCreatedSubscription {
    postCreated {
      id
      title
      status
      updatedAt
      authorID
      author {
        id
        displayName
        email
        username
      }
    }
  }
`;

export const postDeletedSubscription = graphql`
  subscription PostsSubscriptionsPostDeletedSubscription {
    postDeleted
  }
`;

export function getPostCreatedRecord(store: RecordSourceSelectorProxy) {
  return store.getRootField("postCreated");
}

export function getPostDeletedId(store: RecordSourceSelectorProxy): string | null {
  const value = store.getRoot().getValue("postDeleted");
  return typeof value === "string" ? value : null;
}
