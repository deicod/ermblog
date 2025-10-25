/**
 * @generated SignedSource<<84581a0f17644aed249f5b98c4b8fc45>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type AssignUserRolesInput = {
  clientMutationId?: string | null | undefined;
  roleIDs: ReadonlyArray<string>;
  userID: string;
};
export type UserFormDialogAssignUserRolesMutation$variables = {
  input: AssignUserRolesInput;
};
export type UserFormDialogAssignUserRolesMutation$data = {
  readonly assignUserRoles: {
    readonly user: {
      readonly id: string;
    } | null | undefined;
  };
};
export type UserFormDialogAssignUserRolesMutation = {
  response: UserFormDialogAssignUserRolesMutation$data;
  variables: UserFormDialogAssignUserRolesMutation$variables;
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
    "concreteType": "AssignUserRolesPayload",
    "kind": "LinkedField",
    "name": "assignUserRoles",
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
    "name": "UserFormDialogAssignUserRolesMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "UserFormDialogAssignUserRolesMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "e35f6efb368cbd1b58f50e32edb56785",
    "id": null,
    "metadata": {},
    "name": "UserFormDialogAssignUserRolesMutation",
    "operationKind": "mutation",
    "text": "mutation UserFormDialogAssignUserRolesMutation(\n  $input: AssignUserRolesInput!\n) {\n  assignUserRoles(input: $input) {\n    user {\n      id\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "5f6de39ea2f4221bbc99bdd1be5aa7d8";

export default node;
