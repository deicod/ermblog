/**
 * @generated SignedSource<<6fd131a144a79940dd6aaedaa57a3c40>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type PostsSubscriptionsPostDeletedSubscription$variables = Record<PropertyKey, never>;
export type PostsSubscriptionsPostDeletedSubscription$data = {
  readonly postDeleted: string;
};
export type PostsSubscriptionsPostDeletedSubscription = {
  response: PostsSubscriptionsPostDeletedSubscription$data;
  variables: PostsSubscriptionsPostDeletedSubscription$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "postDeleted",
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "PostsSubscriptionsPostDeletedSubscription",
    "selections": (v0/*: any*/),
    "type": "Subscription",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "PostsSubscriptionsPostDeletedSubscription",
    "selections": (v0/*: any*/)
  },
  "params": {
    "cacheID": "c31e6d3fc694a38047724e84cac45be3",
    "id": null,
    "metadata": {},
    "name": "PostsSubscriptionsPostDeletedSubscription",
    "operationKind": "subscription",
    "text": "subscription PostsSubscriptionsPostDeletedSubscription {\n  postDeleted\n}\n"
  }
};
})();

(node as any).hash = "94a7757b4f4c8764f5c2566a0fc8d7ec";

export default node;
