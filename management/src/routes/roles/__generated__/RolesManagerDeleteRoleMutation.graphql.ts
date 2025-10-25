/**
 * @generated SignedSource<<b55591049040fe84331453adbcef1d3c>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type DeleteRoleInput = {
  clientMutationId?: string | null | undefined;
  id: string;
};
export type RolesManagerDeleteRoleMutation$variables = {
  input: DeleteRoleInput;
};
export type RolesManagerDeleteRoleMutation$data = {
  readonly deleteRole: {
    readonly deletedRoleID: string;
  };
};
export type RolesManagerDeleteRoleMutation = {
  response: RolesManagerDeleteRoleMutation$data;
  variables: RolesManagerDeleteRoleMutation$variables;
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
    "concreteType": "DeleteRolePayload",
    "kind": "LinkedField",
    "name": "deleteRole",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "deletedRoleID",
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
    "name": "RolesManagerDeleteRoleMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "RolesManagerDeleteRoleMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "39a7a3b0355fd13b34d841bfe5a7db2c",
    "id": null,
    "metadata": {},
    "name": "RolesManagerDeleteRoleMutation",
    "operationKind": "mutation",
    "text": "mutation RolesManagerDeleteRoleMutation(\n  $input: DeleteRoleInput!\n) {\n  deleteRole(input: $input) {\n    deletedRoleID\n  }\n}\n"
  }
};
})();

(node as any).hash = "b0adf804112c893ad264c135fa4c912f";

export default node;
