/**
 * @generated SignedSource<<5dd52d06effc2bcbbbd312b78f52d69b>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type UpdateRoleInput = {
  capabilities?: any | null | undefined;
  clientMutationId?: string | null | undefined;
  createdAt?: any | null | undefined;
  description?: string | null | undefined;
  id: string;
  name?: string | null | undefined;
  slug?: string | null | undefined;
  updatedAt?: any | null | undefined;
};
export type RoleFormDialogUpdateRoleMutation$variables = {
  input: UpdateRoleInput;
};
export type RoleFormDialogUpdateRoleMutation$data = {
  readonly updateRole: {
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
export type RoleFormDialogUpdateRoleMutation = {
  response: RoleFormDialogUpdateRoleMutation$data;
  variables: RoleFormDialogUpdateRoleMutation$variables;
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
    "concreteType": "UpdateRolePayload",
    "kind": "LinkedField",
    "name": "updateRole",
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
    "name": "RoleFormDialogUpdateRoleMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "RoleFormDialogUpdateRoleMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "bb922461abd493a3be97dc938541c944",
    "id": null,
    "metadata": {},
    "name": "RoleFormDialogUpdateRoleMutation",
    "operationKind": "mutation",
    "text": "mutation RoleFormDialogUpdateRoleMutation(\n  $input: UpdateRoleInput!\n) {\n  updateRole(input: $input) {\n    role {\n      id\n      name\n      slug\n      description\n      capabilities\n      createdAt\n      updatedAt\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "63878cace4225ca050f6cb6306dfbca8";

export default node;
