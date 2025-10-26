/**
 * @generated SignedSource<<4473dc0f8c4f687c80bd985749d98c13>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CommentsSubscriptionsCommentDeletedSubscription$variables = Record<PropertyKey, never>;
export type CommentsSubscriptionsCommentDeletedSubscription$data = {
  readonly commentDeleted: string;
};
export type CommentsSubscriptionsCommentDeletedSubscription = {
  response: CommentsSubscriptionsCommentDeletedSubscription$data;
  variables: CommentsSubscriptionsCommentDeletedSubscription$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "commentDeleted",
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "CommentsSubscriptionsCommentDeletedSubscription",
    "selections": (v0/*: any*/),
    "type": "Subscription",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "CommentsSubscriptionsCommentDeletedSubscription",
    "selections": (v0/*: any*/)
  },
  "params": {
    "cacheID": "2eac699db60f64c5a66a3349a64343eb",
    "id": null,
    "metadata": {},
    "name": "CommentsSubscriptionsCommentDeletedSubscription",
    "operationKind": "subscription",
    "text": "subscription CommentsSubscriptionsCommentDeletedSubscription {\n  commentDeleted\n}\n"
  }
};
})();

(node as any).hash = "773676148f149aceddea95dae008b4e7";

export default node;
