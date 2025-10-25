/**
 * @generated SignedSource<<73c43629c9a90fb0614645eeffa82848>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CreateRoleInput = {
  capabilities?: any | null | undefined;
  clientMutationId?: string | null | undefined;
  createdAt?: any | null | undefined;
  description?: string | null | undefined;
  id?: string | null | undefined;
  name?: string | null | undefined;
  slug?: string | null | undefined;
  updatedAt?: any | null | undefined;
};
export type RoleFormDialogCreateRoleMutation$variables = {
  input: CreateRoleInput;
};
export type RoleFormDialogCreateRoleMutation$data = {
  readonly createRole: {
    readonly role: {
      readonly capabilities: any | null | undefined;
      readonly createdAt: any;
      readonly description: string | null | undefined;
      readonly id: string;
      readonly name: string;
      readonly slug: string;
      readonly updatedAt: any;
    } | null | undefined;
  };
};
export type RoleFormDialogCreateRoleMutation = {
  response: RoleFormDialogCreateRoleMutation$data;
  variables: RoleFormDialogCreateRoleMutation$variables;
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
    "concreteType": "CreateRolePayload",
    "kind": "LinkedField",
    "name": "createRole",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "Role",
        "kind": "LinkedField",
        "name": "role",
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
            "name": "name",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "slug",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "description",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "capabilities",
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
    "name": "RoleFormDialogCreateRoleMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "RoleFormDialogCreateRoleMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "cb4e84f642652934460746d49ece601b",
    "id": null,
    "metadata": {},
    "name": "RoleFormDialogCreateRoleMutation",
    "operationKind": "mutation",
    "text": "mutation RoleFormDialogCreateRoleMutation(\n  $input: CreateRoleInput!\n) {\n  createRole(input: $input) {\n    role {\n      id\n      name\n      slug\n      description\n      capabilities\n      createdAt\n      updatedAt\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "623f522b415752d48e7c8cff97627253";

export default node;
