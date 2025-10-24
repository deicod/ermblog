/**
 * @generated SignedSource<<754be261901f01e934641d127c214064>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type dashboardHealthQuery$variables = Record<PropertyKey, never>;
export type dashboardHealthQuery$data = {
  readonly health: string;
  readonly managementStats: {
    readonly comments: number;
    readonly mediaItems: number;
    readonly posts: number;
    readonly taxonomies: number;
    readonly users: number;
  } | null | undefined;
};
export type dashboardHealthQuery = {
  response: dashboardHealthQuery$data;
  variables: dashboardHealthQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "health",
    "storageKey": null
  },
  {
    "alias": null,
    "args": null,
    "concreteType": "ManagementStats",
    "kind": "LinkedField",
    "name": "managementStats",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "posts",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "comments",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "mediaItems",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "taxonomies",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "users",
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
    "name": "dashboardHealthQuery",
    "selections": (v0/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "dashboardHealthQuery",
    "selections": (v0/*: any*/)
  },
  "params": {
    "cacheID": "23fd425b49c5203d928203cb32dff917",
    "id": null,
    "metadata": {},
    "name": "dashboardHealthQuery",
    "operationKind": "query",
    "text": "query dashboardHealthQuery {\n  health\n  managementStats {\n    posts\n    comments\n    mediaItems\n    taxonomies\n    users\n  }\n}\n"
  }
};
})();

(node as any).hash = "39b7cdc67bba4313a73f43a04b00e658";

export default node;
