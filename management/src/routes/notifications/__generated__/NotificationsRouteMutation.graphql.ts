/**
 * @generated SignedSource<<5088d0dacbaae221ce778c1490406966>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type NotificationCategory = "COMMENT_CREATED" | "COMMENT_DELETED" | "COMMENT_UPDATED" | "POST_CREATED" | "POST_DELETED" | "POST_UPDATED" | "%future added value";
export type UpdateNotificationPreferencesInput = {
  clientMutationId?: string | null | undefined;
  preferences: ReadonlyArray<NotificationPreferenceInput>;
};
export type NotificationPreferenceInput = {
  category: NotificationCategory;
  enabled: boolean;
};
export type NotificationsRouteMutation$variables = {
  input: UpdateNotificationPreferencesInput;
};
export type NotificationsRouteMutation$data = {
  readonly updateNotificationPreferences: {
    readonly preferences: {
      readonly entries: ReadonlyArray<{
        readonly category: NotificationCategory;
        readonly enabled: boolean;
      }>;
    };
  };
};
export type NotificationsRouteMutation = {
  response: NotificationsRouteMutation$data;
  variables: NotificationsRouteMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "input"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "input",
        "variableName": "input"
      }
    ],
    "concreteType": "UpdateNotificationPreferencesPayload",
    "kind": "LinkedField",
    "name": "updateNotificationPreferences",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "NotificationPreferences",
        "kind": "LinkedField",
        "name": "preferences",
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
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "NotificationsRouteMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "NotificationsRouteMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "4dc9f088d8ac9bab28f67eb550483ce1",
    "id": null,
    "metadata": {},
    "name": "NotificationsRouteMutation",
    "operationKind": "mutation",
    "text": "mutation NotificationsRouteMutation(\n  $input: UpdateNotificationPreferencesInput!\n) {\n  updateNotificationPreferences(input: $input) {\n    preferences {\n      entries {\n        category\n        enabled\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "17d6018bdedcfbd9723cbabf7e5069c2";

export default node;
