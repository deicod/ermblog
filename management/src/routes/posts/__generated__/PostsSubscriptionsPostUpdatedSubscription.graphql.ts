/**
 * @generated SignedSource<<2a2a0a6f7891157139fd66e03cdb5e5f>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type PostStatus = "archived" | "draft" | "pending" | "private" | "published" | "%future added value";
export type PostsSubscriptionsPostUpdatedSubscription$variables = Record<PropertyKey, never>;
export type PostsSubscriptionsPostUpdatedSubscription$data = {
  readonly postUpdated: {
    readonly author: {
      readonly displayName: string | null | undefined;
      readonly email: string;
      readonly id: string;
      readonly username: string;
    } | null | undefined;
    readonly authorID: string;
    readonly id: string;
    readonly status: PostStatus;
    readonly title: string;
    readonly updatedAt: any;
  };
};
export type PostsSubscriptionsPostUpdatedSubscription = {
  response: PostsSubscriptionsPostUpdatedSubscription$data;
  variables: PostsSubscriptionsPostUpdatedSubscription$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v1 = [
  {
    "alias": null,
    "args": null,
    "concreteType": "Post",
    "kind": "LinkedField",
    "name": "postUpdated",
    "plural": false,
    "selections": [
      (v0/*: any*/),
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "title",
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
        "name": "updatedAt",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "authorID",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "User",
        "kind": "LinkedField",
        "name": "author",
        "plural": false,
        "selections": [
          (v0/*: any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "displayName",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "email",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "username",
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
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "PostsSubscriptionsPostUpdatedSubscription",
    "selections": (v1/*: any*/),
    "type": "Subscription",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "PostsSubscriptionsPostUpdatedSubscription",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "2eb11c033367cec4804b67d89d4ca3bf",
    "id": null,
    "metadata": {},
    "name": "PostsSubscriptionsPostUpdatedSubscription",
    "operationKind": "subscription",
    "text": "subscription PostsSubscriptionsPostUpdatedSubscription {\n  postUpdated {\n    id\n    title\n    status\n    updatedAt\n    authorID\n    author {\n      id\n      displayName\n      email\n      username\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "9e43be15df951556480bb50d0a9694a3";

export default node;
