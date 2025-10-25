/**
 * @generated SignedSource<<5b363fe0d3a9904364bf29c3fed96e90>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CommentStatus = "approved" | "pending" | "spam" | "trash" | "%future added value";
export type UpdateCommentInput = {
  authorEmail?: string | null | undefined;
  authorID?: string | null | undefined;
  authorName?: string | null | undefined;
  authorURL?: string | null | undefined;
  clientMutationId?: string | null | undefined;
  content?: string | null | undefined;
  id: string;
  parentID?: string | null | undefined;
  postID?: string | null | undefined;
  publishedAt?: any | null | undefined;
  status?: CommentStatus | null | undefined;
  submittedAt?: any | null | undefined;
  updatedAt?: any | null | undefined;
};
export type CommentsTableUpdateCommentStatusMutation$variables = {
  input: UpdateCommentInput;
};
export type CommentsTableUpdateCommentStatusMutation$data = {
  readonly updateComment: {
    readonly comment: {
      readonly id: string;
      readonly status: CommentStatus;
    } | null | undefined;
  };
};
export type CommentsTableUpdateCommentStatusMutation = {
  response: CommentsTableUpdateCommentStatusMutation$data;
  variables: CommentsTableUpdateCommentStatusMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "input"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "input",
        "variableName": "input"
      }
    ],
    "concreteType": "UpdateCommentPayload",
    "kind": "LinkedField",
    "name": "updateComment",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "Comment",
        "kind": "LinkedField",
        "name": "comment",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "id",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "status",
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "CommentsTableUpdateCommentStatusMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "CommentsTableUpdateCommentStatusMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "543b0f45ba97f5c82724aab024047e5a",
    "id": null,
    "metadata": {},
    "name": "CommentsTableUpdateCommentStatusMutation",
    "operationKind": "mutation",
    "text": "mutation CommentsTableUpdateCommentStatusMutation(\n  $input: UpdateCommentInput!\n) {\n  updateComment(input: $input) {\n    comment {\n      id\n      status\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "dc44f6276635774d83ff74bf47568801";

export default node;
