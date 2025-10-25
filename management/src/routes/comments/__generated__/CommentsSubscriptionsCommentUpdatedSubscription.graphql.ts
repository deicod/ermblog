/**
 * @generated SignedSource<<cc963cc9408e1d10451926c4030a06b4>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CommentStatus = "approved" | "pending" | "spam" | "trash" | "%future added value";
export type CommentsSubscriptionsCommentUpdatedSubscription$variables = Record<PropertyKey, never>;
export type CommentsSubscriptionsCommentUpdatedSubscription$data = {
  readonly commentUpdated: {
    readonly authorName: string | null | undefined;
    readonly content: string;
    readonly id: string;
    readonly status: CommentStatus;
    readonly submittedAt: any;
  };
};
export type CommentsSubscriptionsCommentUpdatedSubscription = {
  response: CommentsSubscriptionsCommentUpdatedSubscription$data;
  variables: CommentsSubscriptionsCommentUpdatedSubscription$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "alias": null,
    "args": null,
    "concreteType": "Comment",
    "kind": "LinkedField",
    "name": "commentUpdated",
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
        "name": "content",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "status",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "authorName",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "submittedAt",
        "storageKey": null
      }
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "CommentsSubscriptionsCommentUpdatedSubscription",
    "selections": (v0/*: any*/),
    "type": "Subscription",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "CommentsSubscriptionsCommentUpdatedSubscription",
    "selections": (v0/*: any*/)
  },
  "params": {
    "cacheID": "e2260ceb0585ca62391183db74b3a50f",
    "id": null,
    "metadata": {},
    "name": "CommentsSubscriptionsCommentUpdatedSubscription",
    "operationKind": "subscription",
    "text": "subscription CommentsSubscriptionsCommentUpdatedSubscription {\n  commentUpdated {\n    id\n    content\n    status\n    authorName\n    submittedAt\n  }\n}\n"
  }
};
})();

(node as any).hash = "f401e0bb122f6d591ae5b5ca770f3765";

export default node;
