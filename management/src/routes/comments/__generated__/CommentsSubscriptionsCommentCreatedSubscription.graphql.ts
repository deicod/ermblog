/**
 * @generated SignedSource<<dae731919ca5066016ccbd319750563f>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CommentStatus = "approved" | "pending" | "spam" | "trash" | "%future added value";
export type CommentsSubscriptionsCommentCreatedSubscription$variables = Record<PropertyKey, never>;
export type CommentsSubscriptionsCommentCreatedSubscription$data = {
  readonly commentCreated: {
    readonly authorName: string | null | undefined;
    readonly content: string;
    readonly id: string;
    readonly status: CommentStatus;
    readonly submittedAt: any;
  };
};
export type CommentsSubscriptionsCommentCreatedSubscription = {
  response: CommentsSubscriptionsCommentCreatedSubscription$data;
  variables: CommentsSubscriptionsCommentCreatedSubscription$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "alias": null,
    "args": null,
    "concreteType": "Comment",
    "kind": "LinkedField",
    "name": "commentCreated",
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
    "name": "CommentsSubscriptionsCommentCreatedSubscription",
    "selections": (v0/*: any*/),
    "type": "Subscription",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "CommentsSubscriptionsCommentCreatedSubscription",
    "selections": (v0/*: any*/)
  },
  "params": {
    "cacheID": "fdfad3af0ab2bd2a715547fb48afa31c",
    "id": null,
    "metadata": {},
    "name": "CommentsSubscriptionsCommentCreatedSubscription",
    "operationKind": "subscription",
    "text": "subscription CommentsSubscriptionsCommentCreatedSubscription {\n  commentCreated {\n    id\n    content\n    status\n    authorName\n    submittedAt\n  }\n}\n"
  }
};
})();

(node as any).hash = "258276108f420c6a13a72dada366cd57";

export default node;
