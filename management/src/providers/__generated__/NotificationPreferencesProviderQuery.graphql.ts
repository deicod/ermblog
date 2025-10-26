/**
 * @generated SignedSource<<c76fe9f73fec84176802c2c8e669e250>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type NotificationCategory = "COMMENT_CREATED" | "COMMENT_DELETED" | "COMMENT_UPDATED" | "POST_CREATED" | "POST_DELETED" | "POST_UPDATED" | "%future added value";
export type NotificationPreferencesProviderQuery$variables = Record<PropertyKey, never>;
export type NotificationPreferencesProviderQuery$data = {
  readonly notificationPreferences: {
    readonly entries: ReadonlyArray<{
      readonly category: NotificationCategory;
      readonly enabled: boolean;
    }>;
  };
};
export type NotificationPreferencesProviderQuery = {
  response: NotificationPreferencesProviderQuery$data;
  variables: NotificationPreferencesProviderQuery$variables;
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
    "name": "NotificationPreferencesProviderQuery",
    "selections": (v0/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "NotificationPreferencesProviderQuery",
    "selections": (v0/*: any*/)
  },
  "params": {
    "cacheID": "990775f4f01b97a9477847373ee8ad47",
    "id": null,
    "metadata": {},
    "name": "NotificationPreferencesProviderQuery",
    "operationKind": "query",
    "text": "query NotificationPreferencesProviderQuery {\n  notificationPreferences {\n    entries {\n      category\n      enabled\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "8eed266196c63e0ab5c43b94fd74ab5e";

export default node;
