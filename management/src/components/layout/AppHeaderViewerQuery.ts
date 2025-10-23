import { graphql } from "react-relay";

export const appHeaderViewerQuery = graphql`
  query AppHeaderViewerQuery {
    viewer {
      id
      displayName
      email
      avatarURL
    }
  }
`;
