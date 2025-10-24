/**
 * @generated SignedSource<<7362ac0ba9bbc91a968b40c728bd76ea>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CreateOptionInput = {
  autoload?: boolean | null | undefined;
  clientMutationId?: string | null | undefined;
  createdAt?: any | null | undefined;
  id?: string | null | undefined;
  name?: string | null | undefined;
  updatedAt?: any | null | undefined;
  value?: any | null | undefined;
};
export type OptionCreatorCreateOptionMutation$variables = {
  input: CreateOptionInput;
};
export type OptionCreatorCreateOptionMutation$data = {
  readonly createOption: {
    readonly option: {
      readonly autoload: boolean;
      readonly id: string;
      readonly name: string;
      readonly updatedAt: any;
      readonly value: any;
    } | null | undefined;
  };
};
export type OptionCreatorCreateOptionMutation = {
  response: OptionCreatorCreateOptionMutation$data;
  variables: OptionCreatorCreateOptionMutation$variables;
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
    "concreteType": "CreateOptionPayload",
    "kind": "LinkedField",
    "name": "createOption",
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
            "name": "name",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "autoload",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "updatedAt",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "value",
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
    "name": "OptionCreatorCreateOptionMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "OptionCreatorCreateOptionMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "f15030f9d77879431986ee8acc5e2295",
    "id": null,
    "metadata": {},
    "name": "OptionCreatorCreateOptionMutation",
    "operationKind": "mutation",
    "text": "mutation OptionCreatorCreateOptionMutation(\n  $input: CreateOptionInput!\n) {\n  createOption(input: $input) {\n    option {\n      id\n      name\n      autoload\n      updatedAt\n      value\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "3add7a478d2e3e0a3ffbc5274475d60e";

export default node;
