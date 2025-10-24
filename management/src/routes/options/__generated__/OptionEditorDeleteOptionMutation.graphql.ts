/**
 * @generated SignedSource<<edb3fbad6ce230a95eee08d9d7e9af0d>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type DeleteOptionInput = {
  clientMutationId?: string | null | undefined;
  id: string;
};
export type OptionEditorDeleteOptionMutation$variables = {
  input: DeleteOptionInput;
};
export type OptionEditorDeleteOptionMutation$data = {
  readonly deleteOption: {
    readonly deletedOptionID: string;
  };
};
export type OptionEditorDeleteOptionMutation = {
  response: OptionEditorDeleteOptionMutation$data;
  variables: OptionEditorDeleteOptionMutation$variables;
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
    "concreteType": "DeleteOptionPayload",
    "kind": "LinkedField",
    "name": "deleteOption",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "deletedOptionID",
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
    "name": "OptionEditorDeleteOptionMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "OptionEditorDeleteOptionMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "a98cc0f15cc473078d87721c0f1608ce",
    "id": null,
    "metadata": {},
    "name": "OptionEditorDeleteOptionMutation",
    "operationKind": "mutation",
    "text": "mutation OptionEditorDeleteOptionMutation(\n  $input: DeleteOptionInput!\n) {\n  deleteOption(input: $input) {\n    deletedOptionID\n  }\n}\n"
  }
};
})();

(node as any).hash = "4f7780d4af4b33df08dd18af05b06613";

export default node;
