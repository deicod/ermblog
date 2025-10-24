/**
 * @generated SignedSource<<6b0a9e6b065e02a7e4f9bac1bc88f93f>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CreateTagInput = {
  clientMutationId?: string | null | undefined;
  createdAt?: any | null | undefined;
  description?: string | null | undefined;
  id?: string | null | undefined;
  name?: string | null | undefined;
  slug?: string | null | undefined;
  updatedAt?: any | null | undefined;
};
export type TagEditorCreateTagMutation$variables = {
  input: CreateTagInput;
};
export type TagEditorCreateTagMutation$data = {
  readonly createTag: {
    readonly tag: {
      readonly description: string | null | undefined;
      readonly id: string;
      readonly name: string;
      readonly slug: string;
    } | null | undefined;
  };
};
export type TagEditorCreateTagMutation = {
  response: TagEditorCreateTagMutation$data;
  variables: TagEditorCreateTagMutation$variables;
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
    "concreteType": "CreateTagPayload",
    "kind": "LinkedField",
    "name": "createTag",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "Tag",
        "kind": "LinkedField",
        "name": "tag",
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
    "name": "TagEditorCreateTagMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "TagEditorCreateTagMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "1788bce55b82edfc5dcb3fe4a68a7396",
    "id": null,
    "metadata": {},
    "name": "TagEditorCreateTagMutation",
    "operationKind": "mutation",
    "text": "mutation TagEditorCreateTagMutation(\n  $input: CreateTagInput!\n) {\n  createTag(input: $input) {\n    tag {\n      id\n      name\n      slug\n      description\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "983d2a574f40adf641f6ce78e8a74c00";

export default node;
