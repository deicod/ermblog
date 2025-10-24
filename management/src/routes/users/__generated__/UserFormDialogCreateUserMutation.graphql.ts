/**
 * @generated SignedSource<<736304c7dfe552d3fccd512077fcecba>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CreateUserInput = {
  avatarURL?: string | null | undefined;
  bio?: string | null | undefined;
  clientMutationId?: string | null | undefined;
  createdAt?: any | null | undefined;
  displayName?: string | null | undefined;
  email?: string | null | undefined;
  id?: string | null | undefined;
  lastLoginAt?: any | null | undefined;
  passwordHash?: string | null | undefined;
  updatedAt?: any | null | undefined;
  username?: string | null | undefined;
  websiteURL?: string | null | undefined;
};
export type UserFormDialogCreateUserMutation$variables = {
  input: CreateUserInput;
};
export type UserFormDialogCreateUserMutation$data = {
  readonly createUser: {
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
export type UserFormDialogCreateUserMutation = {
  response: UserFormDialogCreateUserMutation$data;
  variables: UserFormDialogCreateUserMutation$variables;
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
    "concreteType": "CreateUserPayload",
    "kind": "LinkedField",
    "name": "createUser",
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
    "name": "UserFormDialogCreateUserMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "UserFormDialogCreateUserMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "58746666fbc8ddb1b0ac913940054c29",
    "id": null,
    "metadata": {},
    "name": "UserFormDialogCreateUserMutation",
    "operationKind": "mutation",
    "text": "mutation UserFormDialogCreateUserMutation(\n  $input: CreateUserInput!\n) {\n  createUser(input: $input) {\n    user {\n      id\n      username\n      email\n      displayName\n      bio\n      avatarURL\n      websiteURL\n      createdAt\n      updatedAt\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "278bcc51417df430638be3d20af8339b";

export default node;
