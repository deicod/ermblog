/**
 * @generated SignedSource<<93034f0a02e6151f99bebe1c1df6838f>>
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
    "cacheID": "cb1e1c79c438f5bc138dda539528600c",
    "id": null,
    "metadata": {},
    "name": "dashboardHealthQuery",
    "operationKind": "query",
    "text": "query dashboardHealthQuery {\n  health\n}\n"
  }
};
})();

(node as any).hash = "f7cf717e5babd83dd1d66f0575551ad8";

export default node;
