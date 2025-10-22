/**
 * @generated SignedSource<<8f43ef20ca0cb0b84a55be4c0c7afc0c>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type PostStatus = "archived" | "draft" | "pending" | "private" | "published" | "%future added value";
export type postsOverviewQuery$variables = {
  first?: number | null | undefined;
};
export type postsOverviewQuery$data = {
  readonly posts: {
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly id: string;
        readonly status: PostStatus;
        readonly title: string;
        readonly updatedAt: any;
      } | null | undefined;
    }>;
    readonly totalCount: number;
  };
};
export type postsOverviewQuery = {
  response: postsOverviewQuery$data;
  variables: postsOverviewQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": 5,
    "kind": "LocalArgument",
    "name": "first"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "first",
        "variableName": "first"
      }
    ],
    "concreteType": "PostConnection",
    "kind": "LinkedField",
    "name": "posts",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "totalCount",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "PostEdge",
        "kind": "LinkedField",
        "name": "edges",
        "plural": true,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "Post",
            "kind": "LinkedField",
            "name": "node",
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
              }
            ],
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
    "name": "postsOverviewQuery",
    "selections": (v1/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "postsOverviewQuery",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "c304b7dbd433668ed249198f1d484691",
    "id": null,
    "metadata": {},
    "name": "postsOverviewQuery",
    "operationKind": "query",
    "text": "query postsOverviewQuery(\n  $first: Int = 5\n) {\n  posts(first: $first) {\n    totalCount\n    edges {\n      node {\n        id\n        title\n        status\n        updatedAt\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "f7441eb27954a127a6f4c16fd7de0da4";

export default node;
