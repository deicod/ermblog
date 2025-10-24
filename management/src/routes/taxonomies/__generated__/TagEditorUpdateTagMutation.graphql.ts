/**
 * @generated SignedSource<<f705d9729e3ebbce60911db31a780a82>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type UpdateTagInput = {
  clientMutationId?: string | null | undefined;
  createdAt?: any | null | undefined;
  description?: string | null | undefined;
  id: string;
  name?: string | null | undefined;
  slug?: string | null | undefined;
  updatedAt?: any | null | undefined;
};
export type TagEditorUpdateTagMutation$variables = {
  input: UpdateTagInput;
};
export type TagEditorUpdateTagMutation$data = {
  readonly updateTag: {
    readonly tag: {
      readonly description: string | null | undefined;
      readonly id: string;
      readonly name: string;
      readonly slug: string;
    } | null | undefined;
  };
};
export type TagEditorUpdateTagMutation = {
  response: TagEditorUpdateTagMutation$data;
  variables: TagEditorUpdateTagMutation$variables;
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
    "concreteType": "UpdateTagPayload",
    "kind": "LinkedField",
    "name": "updateTag",
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
    "name": "TagEditorUpdateTagMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "TagEditorUpdateTagMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "3e1bb9beeba90c42b65db5c670e8abbf",
    "id": null,
    "metadata": {},
    "name": "TagEditorUpdateTagMutation",
    "operationKind": "mutation",
    "text": "mutation TagEditorUpdateTagMutation(\n  $input: UpdateTagInput!\n) {\n  updateTag(input: $input) {\n    tag {\n      id\n      name\n      slug\n      description\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "9696594e352f1a009a06fd3ee2d1e250";

export default node;
