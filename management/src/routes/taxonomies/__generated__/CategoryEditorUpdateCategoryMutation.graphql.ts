/**
 * @generated SignedSource<<96a01246ecacb15ec16ce296d3b9d689>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type UpdateCategoryInput = {
  clientMutationId?: string | null | undefined;
  createdAt?: any | null | undefined;
  description?: string | null | undefined;
  id: string;
  name?: string | null | undefined;
  parentID?: string | null | undefined;
  slug?: string | null | undefined;
  updatedAt?: any | null | undefined;
};
export type CategoryEditorUpdateCategoryMutation$variables = {
  input: UpdateCategoryInput;
};
export type CategoryEditorUpdateCategoryMutation$data = {
  readonly updateCategory: {
    readonly category: {
      readonly description: string | null | undefined;
      readonly id: string;
      readonly name: string;
      readonly parentID: string | null | undefined;
      readonly slug: string;
    } | null | undefined;
  };
};
export type CategoryEditorUpdateCategoryMutation = {
  response: CategoryEditorUpdateCategoryMutation$data;
  variables: CategoryEditorUpdateCategoryMutation$variables;
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
    "concreteType": "UpdateCategoryPayload",
    "kind": "LinkedField",
    "name": "updateCategory",
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
    "name": "CategoryEditorUpdateCategoryMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "CategoryEditorUpdateCategoryMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "3bbe2ecb70808f1fcb21f52846f476d6",
    "id": null,
    "metadata": {},
    "name": "CategoryEditorUpdateCategoryMutation",
    "operationKind": "mutation",
    "text": "mutation CategoryEditorUpdateCategoryMutation(\n  $input: UpdateCategoryInput!\n) {\n  updateCategory(input: $input) {\n    category {\n      id\n      name\n      slug\n      description\n      parentID\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "25965e3cb08ab0671d2e7e34b179ff12";

export default node;
