/**
 * @generated SignedSource<<6e27370aa38b300e8010d04f338603c0>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type UpdateUserInput = {
  avatarURL?: string | null | undefined;
  bio?: string | null | undefined;
  clientMutationId?: string | null | undefined;
  createdAt?: any | null | undefined;
  displayName?: string | null | undefined;
  email?: string | null | undefined;
  id: string;
  lastLoginAt?: any | null | undefined;
  password?: string | null | undefined;
  updatedAt?: any | null | undefined;
  username?: string | null | undefined;
  websiteURL?: string | null | undefined;
};
export type UserFormDialogUpdateUserMutation$variables = {
  input: UpdateUserInput;
};
export type UserFormDialogUpdateUserMutation$data = {
  readonly updateUser: {
    readonly user: {
      readonly avatarURL: string | null | undefined;
      readonly bio: string | null | undefined;
      readonly createdAt: any;
      readonly displayName: string | null | undefined;
      readonly email: string;
      readonly id: string;
      readonly updatedAt: any;
      readonly username: string;
      readonly websiteURL: string | null | undefined;
    } | null | undefined;
  };
};
export type UserFormDialogUpdateUserMutation = {
  response: UserFormDialogUpdateUserMutation$data;
  variables: UserFormDialogUpdateUserMutation$variables;
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
    "concreteType": "UpdateUserPayload",
    "kind": "LinkedField",
    "name": "updateUser",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "User",
        "kind": "LinkedField",
        "name": "user",
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
            "name": "username",
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
            "name": "displayName",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "bio",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "avatarURL",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "websiteURL",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "createdAt",
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
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "UserFormDialogUpdateUserMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "UserFormDialogUpdateUserMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "3a68d4af8c150b97f38ccee8516df40b",
    "id": null,
    "metadata": {},
    "name": "UserFormDialogUpdateUserMutation",
    "operationKind": "mutation",
    "text": "mutation UserFormDialogUpdateUserMutation(\n  $input: UpdateUserInput!\n) {\n  updateUser(input: $input) {\n    user {\n      id\n      username\n      email\n      displayName\n      bio\n      avatarURL\n      websiteURL\n      createdAt\n      updatedAt\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "9c155131b9bc49a42ab90354d665cce1";

export default node;
