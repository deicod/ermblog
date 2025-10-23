/**
 * @generated SignedSource<<02dc3a8b7a36bac178c49081dd14bb49>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type AppHeaderViewerQuery$variables = Record<PropertyKey, never>;
export type AppHeaderViewerQuery$data = {
  readonly viewer: {
    readonly avatarURL: string | null | undefined;
    readonly displayName: string | null | undefined;
    readonly email: string | null | undefined;
    readonly id: string;
  } | null | undefined;
};
export type AppHeaderViewerQuery = {
  response: AppHeaderViewerQuery$data;
  variables: AppHeaderViewerQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "alias": null,
    "args": null,
    "concreteType": "Viewer",
    "kind": "LinkedField",
    "name": "viewer",
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
        "name": "avatarURL",
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
    "name": "AppHeaderViewerQuery",
    "selections": (v0/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "AppHeaderViewerQuery",
    "selections": (v0/*: any*/)
  },
  "params": {
    "cacheID": "85181350fb6bff47d27478c85069ce9d",
    "id": null,
    "metadata": {},
    "name": "AppHeaderViewerQuery",
    "operationKind": "query",
    "text": "query AppHeaderViewerQuery {\n  viewer {\n    id\n    displayName\n    email\n    avatarURL\n  }\n}\n"
  }
};
})();

(node as any).hash = "afffcfc721c8844d443fee81922ea043";

export default node;
