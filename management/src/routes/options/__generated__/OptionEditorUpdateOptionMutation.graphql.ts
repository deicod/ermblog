/**
 * @generated SignedSource<<3512c56847848bc0930d0040f935f4d0>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type UpdateOptionInput = {
  autoload?: boolean | null | undefined;
  clientMutationId?: string | null | undefined;
  createdAt?: any | null | undefined;
  id: string;
  name?: string | null | undefined;
  updatedAt?: any | null | undefined;
  value?: any | null | undefined;
};
export type OptionEditorUpdateOptionMutation$variables = {
  input: UpdateOptionInput;
};
export type OptionEditorUpdateOptionMutation$data = {
  readonly updateOption: {
    readonly option: {
      readonly id: string;
      readonly updatedAt: any;
      readonly value: any;
    } | null | undefined;
  };
};
export type OptionEditorUpdateOptionMutation = {
  response: OptionEditorUpdateOptionMutation$data;
  variables: OptionEditorUpdateOptionMutation$variables;
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
    "concreteType": "UpdateOptionPayload",
    "kind": "LinkedField",
    "name": "updateOption",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "Option",
        "kind": "LinkedField",
        "name": "option",
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
            "name": "value",
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
    "name": "OptionEditorUpdateOptionMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "OptionEditorUpdateOptionMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "e018f6306bfd8a942b79936d820fc6a1",
    "id": null,
    "metadata": {},
    "name": "OptionEditorUpdateOptionMutation",
    "operationKind": "mutation",
    "text": "mutation OptionEditorUpdateOptionMutation(\n  $input: UpdateOptionInput!\n) {\n  updateOption(input: $input) {\n    option {\n      id\n      value\n      updatedAt\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "aa55c6d1edecf68f1a7c22cf4a5e270a";

export default node;
