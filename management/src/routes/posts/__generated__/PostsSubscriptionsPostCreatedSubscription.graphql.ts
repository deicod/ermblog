/**
 * @generated SignedSource<<ec4d1e2085eb78688563d0eb72f9c7b0>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type PostStatus = "archived" | "draft" | "pending" | "private" | "published" | "%future added value";
export type PostsSubscriptionsPostCreatedSubscription$variables = Record<PropertyKey, never>;
export type PostsSubscriptionsPostCreatedSubscription$data = {
  readonly postCreated: {
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
export type PostsSubscriptionsPostCreatedSubscription = {
  response: PostsSubscriptionsPostCreatedSubscription$data;
  variables: PostsSubscriptionsPostCreatedSubscription$variables;
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
    "name": "postCreated",
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
    "name": "PostsSubscriptionsPostCreatedSubscription",
    "selections": (v1/*: any*/),
    "type": "Subscription",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "PostsSubscriptionsPostCreatedSubscription",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "06587cf43a267eedce071c1340ce48eb",
    "id": null,
    "metadata": {},
    "name": "PostsSubscriptionsPostCreatedSubscription",
    "operationKind": "subscription",
    "text": "subscription PostsSubscriptionsPostCreatedSubscription {\n  postCreated {\n    id\n    title\n    status\n    updatedAt\n    authorID\n    author {\n      id\n      displayName\n      email\n      username\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "021b35a053c241041fce0eb8aa861d50";

export default node;
