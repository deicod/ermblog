/**
 * @generated SignedSource<<1ce4ec80ab260d5f4ec758d28c941340>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type DeleteCategoryInput = {
  clientMutationId?: string | null | undefined;
  id: string;
};
export type CategoryEditorDeleteCategoryMutation$variables = {
  input: DeleteCategoryInput;
};
export type CategoryEditorDeleteCategoryMutation$data = {
  readonly deleteCategory: {
    readonly deletedCategoryID: string;
  };
};
export type CategoryEditorDeleteCategoryMutation = {
  response: CategoryEditorDeleteCategoryMutation$data;
  variables: CategoryEditorDeleteCategoryMutation$variables;
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
    "concreteType": "DeleteCategoryPayload",
    "kind": "LinkedField",
    "name": "deleteCategory",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "deletedCategoryID",
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
    "name": "CategoryEditorDeleteCategoryMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "CategoryEditorDeleteCategoryMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "ea70b3718b3398dea84e6263fec1d02c",
    "id": null,
    "metadata": {},
    "name": "CategoryEditorDeleteCategoryMutation",
    "operationKind": "mutation",
    "text": "mutation CategoryEditorDeleteCategoryMutation(\n  $input: DeleteCategoryInput!\n) {\n  deleteCategory(input: $input) {\n    deletedCategoryID\n  }\n}\n"
  }
};
})();

(node as any).hash = "4d28f8d619b99a78695a76e01635db35";

export default node;
