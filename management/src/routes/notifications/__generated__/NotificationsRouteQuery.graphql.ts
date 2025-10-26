/**
 * @generated SignedSource<<b5a8ac805bc2667bfdc2a2deeca8f2fb>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type NotificationCategory = "COMMENT_CREATED" | "COMMENT_DELETED" | "COMMENT_UPDATED" | "POST_CREATED" | "POST_DELETED" | "POST_UPDATED" | "%future added value";
export type NotificationsRouteQuery$variables = Record<PropertyKey, never>;
export type NotificationsRouteQuery$data = {
  readonly notificationPreferences: {
    readonly entries: ReadonlyArray<{
      readonly category: NotificationCategory;
      readonly enabled: boolean;
    }>;
  };
};
export type NotificationsRouteQuery = {
  response: NotificationsRouteQuery$data;
  variables: NotificationsRouteQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "alias": null,
    "args": null,
    "concreteType": "NotificationPreferences",
    "kind": "LinkedField",
    "name": "notificationPreferences",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "NotificationPreference",
        "kind": "LinkedField",
        "name": "entries",
        "plural": true,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "category",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "enabled",
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
    "name": "NotificationsRouteQuery",
    "selections": (v0/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "NotificationsRouteQuery",
    "selections": (v0/*: any*/)
  },
  "params": {
    "cacheID": "89f3dc1def41c7a35bb5f641f942e88a",
    "id": null,
    "metadata": {},
    "name": "NotificationsRouteQuery",
    "operationKind": "query",
    "text": "query NotificationsRouteQuery {\n  notificationPreferences {\n    entries {\n      category\n      enabled\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "0b61bae837b2d23f4cdb5dc160f5d237";

export default node;
