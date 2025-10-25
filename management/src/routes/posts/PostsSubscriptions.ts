import { graphql } from "react-relay";

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
