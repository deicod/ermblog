/**
 * @generated SignedSource<<dc8886a764212b636e03f86059a08cb8>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type RemoveUserRolesInput = {
  clientMutationId?: string | null | undefined;
  roleIDs: ReadonlyArray<string>;
  userID: string;
};
export type UserFormDialogRemoveUserRolesMutation$variables = {
  input: RemoveUserRolesInput;
};
export type UserFormDialogRemoveUserRolesMutation$data = {
  readonly removeUserRoles: {
    readonly user: {
      readonly id: string;
    } | null | undefined;
  };
};
export type UserFormDialogRemoveUserRolesMutation = {
  response: UserFormDialogRemoveUserRolesMutation$data;
  variables: UserFormDialogRemoveUserRolesMutation$variables;
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
    "concreteType": "RemoveUserRolesPayload",
    "kind": "LinkedField",
    "name": "removeUserRoles",
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
    "name": "UserFormDialogRemoveUserRolesMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "UserFormDialogRemoveUserRolesMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "34b8c120d22e4115390841a8ee59ee10",
    "id": null,
    "metadata": {},
    "name": "UserFormDialogRemoveUserRolesMutation",
    "operationKind": "mutation",
    "text": "mutation UserFormDialogRemoveUserRolesMutation(\n  $input: RemoveUserRolesInput!\n) {\n  removeUserRoles(input: $input) {\n    user {\n      id\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "f7a0c4aa5b70c4271c458796191e08c7";

export default node;
