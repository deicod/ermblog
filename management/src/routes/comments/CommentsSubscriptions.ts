import { graphql } from "react-relay";

export const commentCreatedSubscription = graphql`
  subscription CommentsSubscriptionsCommentCreatedSubscription {
    commentCreated {
      id
      content
      status
      authorName
      submittedAt
    }
  }
`;

export const commentUpdatedSubscription = graphql`
  subscription CommentsSubscriptionsCommentUpdatedSubscription {
    commentUpdated {
      id
      content
      status
      authorName
      submittedAt
    }
  }
`;
