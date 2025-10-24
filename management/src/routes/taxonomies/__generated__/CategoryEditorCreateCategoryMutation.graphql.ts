/**
 * @generated SignedSource<<8996924d456a1e78a4d3eac107eb6a97>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CreateCategoryInput = {
  clientMutationId?: string | null | undefined;
  createdAt?: any | null | undefined;
  description?: string | null | undefined;
  id?: string | null | undefined;
  name?: string | null | undefined;
  parentID?: string | null | undefined;
  slug?: string | null | undefined;
  updatedAt?: any | null | undefined;
};
export type CategoryEditorCreateCategoryMutation$variables = {
  input: CreateCategoryInput;
};
export type CategoryEditorCreateCategoryMutation$data = {
  readonly createCategory: {
    readonly category: {
      readonly description: string | null | undefined;
      readonly id: string;
      readonly name: string;
      readonly parentID: string | null | undefined;
      readonly slug: string;
    } | null | undefined;
  };
};
export type CategoryEditorCreateCategoryMutation = {
  response: CategoryEditorCreateCategoryMutation$data;
  variables: CategoryEditorCreateCategoryMutation$variables;
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
    "concreteType": "CreateCategoryPayload",
    "kind": "LinkedField",
    "name": "createCategory",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "Category",
        "kind": "LinkedField",
        "name": "category",
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
            "name": "parentID",
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
    "name": "CategoryEditorCreateCategoryMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "CategoryEditorCreateCategoryMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "b9857fa8d9f9b484876b1eb78402a7e9",
    "id": null,
    "metadata": {},
    "name": "CategoryEditorCreateCategoryMutation",
    "operationKind": "mutation",
    "text": "mutation CategoryEditorCreateCategoryMutation(\n  $input: CreateCategoryInput!\n) {\n  createCategory(input: $input) {\n    category {\n      id\n      name\n      slug\n      description\n      parentID\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "3726ad6ce635fb6a8d96ffe0170566a1";

export default node;
